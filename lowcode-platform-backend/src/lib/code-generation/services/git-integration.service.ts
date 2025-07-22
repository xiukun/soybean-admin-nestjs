import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface GitCommitOptions {
  message: string;
  author?: {
    name: string;
    email: string;
  };
  files?: string[];
  createBranch?: boolean;
  branchName?: string;
  push?: boolean;
  remote?: string;
}

export interface GitStatus {
  isRepository: boolean;
  currentBranch: string;
  hasChanges: boolean;
  stagedFiles: string[];
  unstagedFiles: string[];
  untrackedFiles: string[];
  remoteUrl?: string;
}

export interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  message: string;
  files: string[];
  branch: string;
  error?: string;
}

@Injectable()
export class GitIntegrationService {
  private readonly logger = new Logger(GitIntegrationService.name);

  /**
   * Check if directory is a Git repository
   */
  async isGitRepository(projectPath: string): Promise<boolean> {
    try {
      const gitDir = path.join(projectPath, '.git');
      return fs.existsSync(gitDir);
    } catch (error) {
      this.logger.error(`Failed to check Git repository status: ${error.message}`);
      return false;
    }
  }

  /**
   * Initialize Git repository
   */
  async initRepository(projectPath: string): Promise<void> {
    try {
      await this.execGitCommand('init', [], projectPath);
      this.logger.log(`Initialized Git repository in ${projectPath}`);
    } catch (error) {
      this.logger.error(`Failed to initialize Git repository: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Git status
   */
  async getStatus(projectPath: string): Promise<GitStatus> {
    try {
      const isRepo = await this.isGitRepository(projectPath);
      if (!isRepo) {
        return {
          isRepository: false,
          currentBranch: '',
          hasChanges: false,
          stagedFiles: [],
          unstagedFiles: [],
          untrackedFiles: [],
        };
      }

      // Get current branch
      const branchResult = await this.execGitCommand('branch', ['--show-current'], projectPath);
      const currentBranch = branchResult.stdout.trim();

      // Get status
      const statusResult = await this.execGitCommand('status', ['--porcelain'], projectPath);
      const statusLines = statusResult.stdout.trim().split('\n').filter(line => line);

      const stagedFiles: string[] = [];
      const unstagedFiles: string[] = [];
      const untrackedFiles: string[] = [];

      statusLines.forEach(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status[0] !== ' ' && status[0] !== '?') {
          stagedFiles.push(file);
        }
        if (status[1] !== ' ') {
          unstagedFiles.push(file);
        }
        if (status === '??') {
          untrackedFiles.push(file);
        }
      });

      // Get remote URL
      let remoteUrl: string | undefined;
      try {
        const remoteResult = await this.execGitCommand('remote', ['get-url', 'origin'], projectPath);
        remoteUrl = remoteResult.stdout.trim();
      } catch {
        // Remote might not exist
      }

      return {
        isRepository: true,
        currentBranch,
        hasChanges: statusLines.length > 0,
        stagedFiles,
        unstagedFiles,
        untrackedFiles,
        remoteUrl,
      };

    } catch (error) {
      this.logger.error(`Failed to get Git status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create and checkout branch
   */
  async createBranch(projectPath: string, branchName: string, checkout = true): Promise<void> {
    try {
      const args = checkout ? ['-b', branchName] : [branchName];
      await this.execGitCommand('checkout', args, projectPath);
      this.logger.log(`Created and checked out branch: ${branchName}`);
    } catch (error) {
      this.logger.error(`Failed to create branch ${branchName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checkout existing branch
   */
  async checkoutBranch(projectPath: string, branchName: string): Promise<void> {
    try {
      await this.execGitCommand('checkout', [branchName], projectPath);
      this.logger.log(`Checked out branch: ${branchName}`);
    } catch (error) {
      this.logger.error(`Failed to checkout branch ${branchName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add files to staging area
   */
  async addFiles(projectPath: string, files: string[] = ['.']): Promise<void> {
    try {
      await this.execGitCommand('add', files, projectPath);
      this.logger.log(`Added files to staging: ${files.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to add files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Commit changes
   */
  async commit(projectPath: string, options: GitCommitOptions): Promise<GitCommitResult> {
    try {
      // Ensure repository exists
      const isRepo = await this.isGitRepository(projectPath);
      if (!isRepo) {
        await this.initRepository(projectPath);
      }

      // Create branch if requested
      if (options.createBranch && options.branchName) {
        await this.createBranch(projectPath, options.branchName);
      }

      // Add files to staging
      const filesToAdd = options.files || ['.'];
      await this.addFiles(projectPath, filesToAdd);

      // Prepare commit command
      const commitArgs = ['-m', options.message];
      
      if (options.author) {
        commitArgs.push('--author', `"${options.author.name} <${options.author.email}>"`);
      }

      // Execute commit
      const commitResult = await this.execGitCommand('commit', commitArgs, projectPath);

      // Extract commit hash
      const commitHash = await this.getLastCommitHash(projectPath);

      // Get current branch
      const status = await this.getStatus(projectPath);

      // Push if requested
      if (options.push) {
        await this.push(projectPath, options.remote);
      }

      const result: GitCommitResult = {
        success: true,
        commitHash,
        message: options.message,
        files: filesToAdd,
        branch: status.currentBranch,
      };

      this.logger.log(`Successfully committed changes: ${commitHash}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to commit changes: ${error.message}`);
      return {
        success: false,
        message: options.message,
        files: options.files || [],
        branch: '',
        error: error.message,
      };
    }
  }

  /**
   * Push changes to remote
   */
  async push(projectPath: string, remote = 'origin'): Promise<void> {
    try {
      const status = await this.getStatus(projectPath);
      const args = [remote, status.currentBranch];
      
      await this.execGitCommand('push', args, projectPath);
      this.logger.log(`Pushed changes to ${remote}/${status.currentBranch}`);
    } catch (error) {
      this.logger.error(`Failed to push changes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get last commit hash
   */
  async getLastCommitHash(projectPath: string): Promise<string> {
    try {
      const result = await this.execGitCommand('rev-parse', ['HEAD'], projectPath);
      return result.stdout.trim();
    } catch (error) {
      this.logger.error(`Failed to get last commit hash: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get commit history
   */
  async getCommitHistory(projectPath: string, limit = 10): Promise<any[]> {
    try {
      const args = ['--oneline', '--graph', `--max-count=${limit}`];
      const result = await this.execGitCommand('log', args, projectPath);
      
      const commits = result.stdout.trim().split('\n').map(line => {
        const match = line.match(/^(\*\s*)?([a-f0-9]+)\s+(.+)$/);
        if (match) {
          return {
            hash: match[2],
            message: match[3],
            graph: match[1] || '',
          };
        }
        return null;
      }).filter(commit => commit !== null);

      return commits;
    } catch (error) {
      this.logger.error(`Failed to get commit history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create commit for code generation
   */
  async commitGeneratedCode(
    projectPath: string,
    entityNames: string[],
    generatedFiles: string[],
    options: {
      author?: { name: string; email: string };
      createBranch?: boolean;
      branchName?: string;
      push?: boolean;
    } = {}
  ): Promise<GitCommitResult> {
    const commitMessage = this.generateCommitMessage(entityNames, generatedFiles);
    
    const commitOptions: GitCommitOptions = {
      message: commitMessage,
      author: options.author,
      files: generatedFiles,
      createBranch: options.createBranch,
      branchName: options.branchName || `feature/generated-code-${Date.now()}`,
      push: options.push,
    };

    return await this.commit(projectPath, commitOptions);
  }

  /**
   * Generate commit message for code generation
   */
  private generateCommitMessage(entityNames: string[], generatedFiles: string[]): string {
    const entityList = entityNames.join(', ');
    const fileCount = generatedFiles.length;
    
    return `feat: Generate code for entities: ${entityList}

Generated ${fileCount} files:
${generatedFiles.map(file => `- ${file}`).join('\n')}

Auto-generated by Low-Code Platform
Generated at: ${new Date().toISOString()}`;
  }

  /**
   * Execute Git command
   */
  private async execGitCommand(
    command: string,
    args: string[],
    cwd: string
  ): Promise<{ stdout: string; stderr: string }> {
    const fullCommand = `git ${command} ${args.join(' ')}`;
    
    try {
      const result = await execAsync(fullCommand, { cwd });
      return result;
    } catch (error) {
      this.logger.error(`Git command failed: ${fullCommand}`, error);
      throw error;
    }
  }

  /**
   * Check if Git is available
   */
  async isGitAvailable(): Promise<boolean> {
    try {
      await execAsync('git --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Git configuration
   */
  async getGitConfig(projectPath: string): Promise<{ name?: string; email?: string }> {
    try {
      const nameResult = await this.execGitCommand('config', ['user.name'], projectPath);
      const emailResult = await this.execGitCommand('config', ['user.email'], projectPath);
      
      return {
        name: nameResult.stdout.trim() || undefined,
        email: emailResult.stdout.trim() || undefined,
      };
    } catch (error) {
      this.logger.warn(`Failed to get Git config: ${error.message}`);
      return {};
    }
  }
}
