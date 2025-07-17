import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface HotUpdateEvent {
  type: 'file_changed' | 'file_added' | 'file_deleted' | 'schema_updated' | 'template_updated';
  path: string;
  projectId?: string;
  entityId?: string;
  templateId?: string;
  timestamp: Date;
  metadata?: any;
}

export interface HotUpdateConfig {
  enabled: boolean;
  watchPaths: string[];
  excludePatterns: string[];
  debounceMs: number;
  autoRegenerate: boolean;
  notifyClients: boolean;
}

@Injectable()
export class HotUpdateService {
  private readonly logger = new Logger(HotUpdateService.name);
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: HotUpdateConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.config = {
      enabled: process.env.HOT_UPDATE_ENABLED === 'true',
      watchPaths: [
        './generated',
        './templates',
        './schemas',
      ],
      excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/logs/**',
      ],
      debounceMs: 1000,
      autoRegenerate: process.env.HOT_UPDATE_AUTO_REGENERATE === 'true',
      notifyClients: true,
    };

    if (this.config.enabled) {
      this.initializeWatchers();
    }
  }

  /**
   * Initialize file system watchers for hot updates
   */
  private initializeWatchers(): void {
    this.logger.log('Initializing hot update watchers...');

    for (const watchPath of this.config.watchPaths) {
      if (fs.existsSync(watchPath)) {
        this.createWatcher(watchPath);
      }
    }

    // Watch for schema changes in database
    this.watchSchemaChanges();
  }

  /**
   * Create a file system watcher for a specific path
   */
  private createWatcher(watchPath: string): void {
    const watcher = chokidar.watch(watchPath, {
      ignored: this.config.excludePatterns,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: 10,
    });

    watcher
      .on('add', (filePath) => this.handleFileEvent('file_added', filePath))
      .on('change', (filePath) => this.handleFileEvent('file_changed', filePath))
      .on('unlink', (filePath) => this.handleFileEvent('file_deleted', filePath))
      .on('error', (error) => this.logger.error(`Watcher error for ${watchPath}:`, error));

    this.watchers.set(watchPath, watcher);
    this.logger.log(`Created watcher for: ${watchPath}`);
  }

  /**
   * Handle file system events with debouncing
   */
  private handleFileEvent(type: HotUpdateEvent['type'], filePath: string): void {
    const key = `${type}:${filePath}`;
    
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    // Set new debounced timer
    const timer = setTimeout(() => {
      this.processFileEvent(type, filePath);
      this.debounceTimers.delete(key);
    }, this.config.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Process file system events
   */
  private async processFileEvent(type: HotUpdateEvent['type'], filePath: string): Promise<void> {
    try {
      this.logger.debug(`Processing ${type} event for: ${filePath}`);

      const event: HotUpdateEvent = {
        type,
        path: filePath,
        timestamp: new Date(),
      };

      // Determine project/entity/template context
      await this.enrichEventContext(event);

      // Emit event for other services to handle
      this.eventEmitter.emit('hot-update.file-changed', event);

      // Handle specific file types
      if (this.isTemplateFile(filePath)) {
        await this.handleTemplateChange(event);
      } else if (this.isGeneratedFile(filePath)) {
        await this.handleGeneratedFileChange(event);
      } else if (this.isSchemaFile(filePath)) {
        await this.handleSchemaChange(event);
      }

      // Auto-regenerate if enabled
      if (this.config.autoRegenerate && this.shouldAutoRegenerate(event)) {
        await this.triggerAutoRegeneration(event);
      }

      // Notify connected clients
      if (this.config.notifyClients) {
        this.notifyClients(event);
      }

    } catch (error) {
      this.logger.error(`Error processing file event for ${filePath}:`, error);
    }
  }

  /**
   * Enrich event with project/entity/template context
   */
  private async enrichEventContext(event: HotUpdateEvent): Promise<void> {
    const filePath = event.path;

    // Extract project ID from path
    const projectMatch = filePath.match(/\/generated\/([^\/]+)\//);
    if (projectMatch) {
      event.projectId = projectMatch[1];
    }

    // Extract entity information
    const entityMatch = filePath.match(/\/models\/([^\/]+)\.base\.ts$/);
    if (entityMatch) {
      const entityCode = entityMatch[1];
      try {
        const entity = await this.prisma.entity.findFirst({
          where: { code: entityCode },
        });
        if (entity) {
          event.entityId = entity.id;
          event.projectId = entity.projectId;
        }
      } catch (error) {
        this.logger.warn(`Could not find entity for code: ${entityCode}`);
      }
    }

    // Extract template information
    const templateMatch = filePath.match(/\/templates\/([^\/]+)\.template\.ts$/);
    if (templateMatch) {
      const templateCode = templateMatch[1];
      try {
        const template = await this.prisma.codeTemplate.findFirst({
          where: { code: templateCode },
        });
        if (template) {
          event.templateId = template.id;
          // Note: projectId might not be available in template, handle accordingly
          if ('projectId' in template) {
            event.projectId = (template as any).projectId;
          }
        }
      } catch (error) {
        this.logger.warn(`Could not find template for code: ${templateCode}`);
      }
    }
  }

  /**
   * Handle template file changes
   */
  private async handleTemplateChange(event: HotUpdateEvent): Promise<void> {
    this.logger.log(`Template changed: ${event.path}`);

    if (event.templateId) {
      // Update template modification time
      await this.prisma.codeTemplate.update({
        where: { id: event.templateId },
        data: { updatedAt: new Date() },
      });

      // Emit template update event
      this.eventEmitter.emit('hot-update.template-updated', event);
    }
  }

  /**
   * Handle generated file changes
   */
  private async handleGeneratedFileChange(event: HotUpdateEvent): Promise<void> {
    this.logger.log(`Generated file changed: ${event.path}`);

    // Check if it's a biz file (user customization) or base file (auto-generated)
    const isBizFile = event.path.includes('/biz/');
    const isBaseFile = event.path.includes('/base/');

    if (isBizFile) {
      this.logger.debug('User customization detected in biz layer');
      // Don't auto-regenerate for biz files
      event.metadata = { userCustomization: true };
    } else if (isBaseFile) {
      this.logger.warn('Base file modified - this should not happen manually');
      event.metadata = { baseFileModified: true };
    }

    this.eventEmitter.emit('hot-update.generated-file-changed', event);
  }

  /**
   * Handle schema file changes
   */
  private async handleSchemaChange(event: HotUpdateEvent): Promise<void> {
    this.logger.log(`Schema changed: ${event.path}`);

    // Emit schema update event
    this.eventEmitter.emit('hot-update.schema-updated', event);

    // Schema changes might require regeneration
    event.metadata = { requiresRegeneration: true };
  }

  /**
   * Watch for database schema changes
   */
  private watchSchemaChanges(): void {
    // This would integrate with database change detection
    // For now, we'll use a simple polling mechanism
    setInterval(async () => {
      try {
        await this.checkSchemaChanges();
      } catch (error) {
        this.logger.error('Error checking schema changes:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check for database schema changes
   */
  private async checkSchemaChanges(): Promise<void> {
    // This is a simplified implementation
    // In a real system, you'd compare current schema with a stored version
    
    const lastCheck = await this.getLastSchemaCheck();
    const currentTime = new Date();

    // Check if any entities were modified recently
    const recentlyModified = await this.prisma.entity.findMany({
      where: {
        updatedAt: {
          gt: lastCheck,
        },
      },
      include: {
        fields: true,
        // Note: relationships might not be available, handle accordingly
      },
    });

    if (recentlyModified.length > 0) {
      for (const entity of recentlyModified) {
        const event: HotUpdateEvent = {
          type: 'schema_updated',
          path: `schema://${entity.projectId}/${entity.code}`,
          projectId: entity.projectId,
          entityId: entity.id,
          timestamp: currentTime,
          metadata: {
            entityName: entity.name,
            fieldsCount: entity.fields?.length || 0,
            relationshipsCount: (entity as any).relationships?.length || 0,
          },
        };

        this.eventEmitter.emit('hot-update.schema-updated', event);
      }
    }

    await this.updateLastSchemaCheck(currentTime);
  }

  /**
   * Determine if auto-regeneration should be triggered
   */
  private shouldAutoRegenerate(event: HotUpdateEvent): boolean {
    // Don't auto-regenerate for user customizations in biz layer
    if (event.metadata?.userCustomization) {
      return false;
    }

    // Auto-regenerate for schema changes
    if (event.type === 'schema_updated') {
      return true;
    }

    // Auto-regenerate for template changes
    if (event.type === 'template_updated') {
      return true;
    }

    return false;
  }

  /**
   * Trigger automatic code regeneration
   */
  private async triggerAutoRegeneration(event: HotUpdateEvent): Promise<void> {
    if (!event.projectId) {
      this.logger.warn('Cannot auto-regenerate without project ID');
      return;
    }

    this.logger.log(`Triggering auto-regeneration for project: ${event.projectId}`);

    try {
      // Emit regeneration request
      this.eventEmitter.emit('code-generation.auto-regenerate', {
        projectId: event.projectId,
        entityId: event.entityId,
        templateId: event.templateId,
        trigger: event.type,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Error triggering auto-regeneration:', error);
    }
  }

  /**
   * Notify connected clients about changes
   */
  private notifyClients(event: HotUpdateEvent): void {
    // This would integrate with WebSocket or SSE to notify frontend clients
    // For Fastify, we can use fastify-websocket or fastify-sse
    this.eventEmitter.emit('hot-update.notify-clients', event);
  }

  /**
   * Add a new watch path
   */
  async addWatchPath(path: string): Promise<void> {
    if (!this.watchers.has(path) && fs.existsSync(path)) {
      this.createWatcher(path);
    }
  }

  /**
   * Remove a watch path
   */
  async removeWatchPath(path: string): Promise<void> {
    const watcher = this.watchers.get(path);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(path);
      this.logger.log(`Removed watcher for: ${path}`);
    }
  }

  /**
   * Get hot update status
   */
  getStatus(): any {
    return {
      enabled: this.config.enabled,
      watchedPaths: Array.from(this.watchers.keys()),
      activeTimers: this.debounceTimers.size,
      config: this.config,
    };
  }

  /**
   * Enable hot updates
   */
  enable(): void {
    if (!this.config.enabled) {
      this.config.enabled = true;
      this.initializeWatchers();
      this.logger.log('Hot updates enabled');
    }
  }

  /**
   * Disable hot updates
   */
  async disable(): Promise<void> {
    if (this.config.enabled) {
      this.config.enabled = false;
      
      // Close all watchers
      for (const [path, watcher] of this.watchers) {
        await watcher.close();
      }
      this.watchers.clear();

      // Clear all timers
      for (const timer of this.debounceTimers.values()) {
        clearTimeout(timer);
      }
      this.debounceTimers.clear();

      this.logger.log('Hot updates disabled');
    }
  }

  /**
   * Cleanup on service destruction
   */
  async onModuleDestroy(): Promise<void> {
    await this.disable();
  }

  // Helper methods
  private isTemplateFile(filePath: string): boolean {
    return filePath.includes('/templates/') && filePath.endsWith('.template.ts');
  }

  private isGeneratedFile(filePath: string): boolean {
    return filePath.includes('/generated/');
  }

  private isSchemaFile(filePath: string): boolean {
    return filePath.includes('/schemas/') || filePath.endsWith('.schema.json');
  }

  private async getLastSchemaCheck(): Promise<Date> {
    // This would be stored in database or cache
    // For now, return 1 minute ago
    return new Date(Date.now() - 60000);
  }

  private async updateLastSchemaCheck(timestamp: Date): Promise<void> {
    // This would update the stored timestamp
    // For now, just log
    this.logger.debug(`Schema check updated: ${timestamp.toISOString()}`);
  }
}
