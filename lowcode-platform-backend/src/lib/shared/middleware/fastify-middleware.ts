import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Fastify-specific middleware utilities
 */
@Injectable()
export class FastifyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(FastifyMiddleware.name);

  use(req: FastifyRequest, res: FastifyReply, next: Function) {
    // Add request ID for tracing
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = this.generateRequestId();
    }

    // Add security headers
    this.addSecurityHeaders(res);

    // Log request
    this.logRequest(req);

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addSecurityHeaders(res: FastifyReply): void {
    // Security headers for Fastify
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Remove server header
    res.removeHeader('server');
  }

  private logRequest(req: FastifyRequest): void {
    const { method, url, headers } = req;
    const userAgent = headers['user-agent'];
    const requestId = headers['x-request-id'];

    this.logger.log(`${method} ${url} - ${userAgent} [${requestId}]`);
  }
}

/**
 * Fastify request context utilities
 */
export class FastifyRequestContext {
  static getRequestId(req: FastifyRequest): string {
    return req.headers['x-request-id'] as string;
  }

  static getUserId(req: FastifyRequest): string | undefined {
    return (req as any).user?.id;
  }

  static getClientIp(req: FastifyRequest): string {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  static isSecure(req: FastifyRequest): boolean {
    return req.protocol === 'https';
  }

  static getContentType(req: FastifyRequest): string | undefined {
    return req.headers['content-type'];
  }

  static getAcceptLanguage(req: FastifyRequest): string | undefined {
    return req.headers['accept-language'];
  }
}

/**
 * Fastify response utilities
 */
export class FastifyResponseUtils {
  static sendJson(res: FastifyReply, data: any, statusCode = 200): FastifyReply {
    return res.status(statusCode).send(data);
  }

  static sendError(res: FastifyReply, error: Error, statusCode = 500): FastifyReply {
    return res.status(statusCode).send({
      error: error.name,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  static sendSuccess(res: FastifyReply, data?: any, message = 'Success'): FastifyReply {
    return res.status(200).send({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static sendPaginated(
    res: FastifyReply,
    data: any[],
    total: number,
    page: number,
    limit: number
  ): FastifyReply {
    return res.status(200).send({
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  }

  static redirect(res: FastifyReply, url: string, statusCode = 302): FastifyReply {
    return res.redirect(url, statusCode);
  }

  static setCookie(
    res: FastifyReply,
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
      maxAge?: number;
      path?: string;
      domain?: string;
    }
  ): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      ...options,
    };

    // Use the raw response for cookie operations
    res.raw.setHeader('Set-Cookie', `${name}=${value}; ${Object.entries(cookieOptions).map(([k, v]) => `${k}=${v}`).join('; ')}`);
  }

  static clearCookie(res: FastifyReply, name: string, path = '/'): void {
    // Clear cookie by setting it with past expiration
    res.raw.setHeader('Set-Cookie', `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  }
}

/**
 * Fastify file upload utilities
 */
export class FastifyFileUtils {
  static async handleMultipartFile(req: FastifyRequest): Promise<any> {
    try {
      // Check if multipart plugin is available
      if (typeof (req as any).file === 'function') {
        const data = await (req as any).file();
        return data;
      }
      throw new Error('Multipart plugin not available');
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  static async handleMultipartFiles(req: FastifyRequest): Promise<any[]> {
    try {
      // Check if multipart plugin is available
      if (typeof (req as any).files === 'function') {
        const files = await (req as any).files();
        const results = [];

        for await (const file of files) {
          results.push(file);
        }

        return results;
      }
      throw new Error('Multipart plugin not available');
    } catch (error) {
      throw new Error(`Multiple file upload failed: ${error.message}`);
    }
  }

  static validateFileType(file: any, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  static validateFileSize(file: any, maxSize: number): boolean {
    return file.file.bytesRead <= maxSize;
  }

  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = this.getFileExtension(originalName);
    return `${timestamp}_${random}.${extension}`;
  }
}

/**
 * Fastify WebSocket utilities (if using fastify-websocket)
 */
export class FastifyWebSocketUtils {
  static broadcastToAll(server: any, message: any): void {
    server.websocketServer.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }

  static broadcastToRoom(server: any, room: string, message: any): void {
    // This would require implementing room management
    // For now, just broadcast to all
    this.broadcastToAll(server, { room, ...message });
  }

  static sendToClient(client: any, message: any): void {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  }
}

/**
 * Fastify performance utilities
 */
export class FastifyPerformanceUtils {
  static measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    return new Promise(async (resolve, reject) => {
      const start = process.hrtime.bigint();
      
      try {
        const result = await fn();
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        
        resolve({ result, duration });
      } catch (error) {
        reject(error);
      }
    });
  }

  static createTimer(): { stop: () => number } {
    const start = process.hrtime.bigint();
    
    return {
      stop: () => {
        const end = process.hrtime.bigint();
        return Number(end - start) / 1000000; // Convert to milliseconds
      }
    };
  }

  static async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}

/**
 * Fastify validation utilities
 */
export class FastifyValidationUtils {
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeString(str: string): string {
    return str.replace(/[<>]/g, '');
  }

  static validatePagination(page?: number, limit?: number): { page: number; limit: number } {
    const validPage = Math.max(1, page || 1);
    const validLimit = Math.min(100, Math.max(1, limit || 10));
    
    return { page: validPage, limit: validLimit };
  }
}
