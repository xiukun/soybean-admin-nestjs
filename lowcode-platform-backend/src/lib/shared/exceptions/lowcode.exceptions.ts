import { HttpException, HttpStatus } from '@nestjs/common';

export class LowcodeException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code?: string,
    public readonly details?: any,
  ) {
    super(
      {
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

// Project related exceptions
export class ProjectNotFoundException extends LowcodeException {
  constructor(projectId: string) {
    super(
      `Project with ID ${projectId} not found`,
      HttpStatus.NOT_FOUND,
      'PROJECT_NOT_FOUND',
      { projectId },
    );
  }
}

export class ProjectAlreadyExistsException extends LowcodeException {
  constructor(projectName: string) {
    super(
      `Project with name '${projectName}' already exists`,
      HttpStatus.CONFLICT,
      'PROJECT_ALREADY_EXISTS',
      { projectName },
    );
  }
}

export class ProjectValidationException extends LowcodeException {
  constructor(validationErrors: string[]) {
    super(
      'Project validation failed',
      HttpStatus.BAD_REQUEST,
      'PROJECT_VALIDATION_FAILED',
      { validationErrors },
    );
  }
}

// Entity related exceptions
export class EntityNotFoundException extends LowcodeException {
  constructor(entityId: string) {
    super(
      `Entity with ID ${entityId} not found`,
      HttpStatus.NOT_FOUND,
      'ENTITY_NOT_FOUND',
      { entityId },
    );
  }
}

export class EntityAlreadyExistsException extends LowcodeException {
  constructor(entityName: string, projectId: string) {
    super(
      `Entity with name '${entityName}' already exists in project ${projectId}`,
      HttpStatus.CONFLICT,
      'ENTITY_ALREADY_EXISTS',
      { entityName, projectId },
    );
  }
}

export class EntityValidationException extends LowcodeException {
  constructor(validationErrors: string[]) {
    super(
      'Entity validation failed',
      HttpStatus.BAD_REQUEST,
      'ENTITY_VALIDATION_FAILED',
      { validationErrors },
    );
  }
}

export class CircularRelationshipException extends LowcodeException {
  constructor(entityIds: string[]) {
    super(
      'Circular relationship detected',
      HttpStatus.BAD_REQUEST,
      'CIRCULAR_RELATIONSHIP',
      { entityIds },
    );
  }
}

// Template related exceptions
export class TemplateNotFoundException extends LowcodeException {
  constructor(templateId: string) {
    super(
      `Template with ID ${templateId} not found`,
      HttpStatus.NOT_FOUND,
      'TEMPLATE_NOT_FOUND',
      { templateId },
    );
  }
}

export class TemplateAlreadyExistsException extends LowcodeException {
  constructor(templateName: string, projectId: string) {
    super(
      `Template with name '${templateName}' already exists in project ${projectId}`,
      HttpStatus.CONFLICT,
      'TEMPLATE_ALREADY_EXISTS',
      { templateName, projectId },
    );
  }
}

export class TemplateCompilationException extends LowcodeException {
  constructor(templateId: string, compilationError: string) {
    super(
      'Template compilation failed',
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_COMPILATION_FAILED',
      { templateId, compilationError },
    );
  }
}

export class TemplateValidationException extends LowcodeException {
  constructor(templateId: string, validationErrors: string[]) {
    super(
      'Template validation failed',
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_VALIDATION_FAILED',
      { templateId, validationErrors },
    );
  }
}

export class TemplateVariableException extends LowcodeException {
  constructor(templateId: string, variableErrors: Array<{ variable: string; message: string }>) {
    super(
      'Template variable validation failed',
      HttpStatus.BAD_REQUEST,
      'TEMPLATE_VARIABLE_VALIDATION_FAILED',
      { templateId, variableErrors },
    );
  }
}

// Code generation related exceptions
export class CodeGenerationException extends LowcodeException {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'CODE_GENERATION_FAILED',
      details,
    );
  }
}

export class CodeGenerationValidationException extends LowcodeException {
  constructor(validationErrors: string[]) {
    super(
      'Code generation validation failed',
      HttpStatus.BAD_REQUEST,
      'CODE_GENERATION_VALIDATION_FAILED',
      { validationErrors },
    );
  }
}

export class UnsupportedArchitectureException extends LowcodeException {
  constructor(architecture: string) {
    super(
      `Unsupported architecture: ${architecture}`,
      HttpStatus.BAD_REQUEST,
      'UNSUPPORTED_ARCHITECTURE',
      { architecture },
    );
  }
}

export class UnsupportedFrameworkException extends LowcodeException {
  constructor(framework: string) {
    super(
      `Unsupported framework: ${framework}`,
      HttpStatus.BAD_REQUEST,
      'UNSUPPORTED_FRAMEWORK',
      { framework },
    );
  }
}

// File system related exceptions
export class FileSystemException extends LowcodeException {
  constructor(operation: string, path: string, error: string) {
    super(
      `File system operation '${operation}' failed`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'FILE_SYSTEM_ERROR',
      { operation, path, error },
    );
  }
}

export class FileNotFoundException extends LowcodeException {
  constructor(filePath: string) {
    super(
      `File not found: ${filePath}`,
      HttpStatus.NOT_FOUND,
      'FILE_NOT_FOUND',
      { filePath },
    );
  }
}

export class DirectoryNotFoundException extends LowcodeException {
  constructor(directoryPath: string) {
    super(
      `Directory not found: ${directoryPath}`,
      HttpStatus.NOT_FOUND,
      'DIRECTORY_NOT_FOUND',
      { directoryPath },
    );
  }
}

export class InsufficientPermissionsException extends LowcodeException {
  constructor(operation: string, path: string) {
    super(
      `Insufficient permissions for operation '${operation}' on path: ${path}`,
      HttpStatus.FORBIDDEN,
      'INSUFFICIENT_PERMISSIONS',
      { operation, path },
    );
  }
}

// Database related exceptions
export class DatabaseConnectionException extends LowcodeException {
  constructor(error: string) {
    super(
      'Database connection failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'DATABASE_CONNECTION_FAILED',
      { error },
    );
  }
}

export class DatabaseQueryException extends LowcodeException {
  constructor(query: string, error: string) {
    super(
      'Database query failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'DATABASE_QUERY_FAILED',
      { query, error },
    );
  }
}

export class DatabaseTransactionException extends LowcodeException {
  constructor(error: string) {
    super(
      'Database transaction failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'DATABASE_TRANSACTION_FAILED',
      { error },
    );
  }
}

// External service related exceptions
export class ExternalServiceException extends LowcodeException {
  constructor(serviceName: string, error: string) {
    super(
      `External service '${serviceName}' error`,
      HttpStatus.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR',
      { serviceName, error },
    );
  }
}

export class ExternalServiceTimeoutException extends LowcodeException {
  constructor(serviceName: string, timeout: number) {
    super(
      `External service '${serviceName}' timeout after ${timeout}ms`,
      HttpStatus.GATEWAY_TIMEOUT,
      'EXTERNAL_SERVICE_TIMEOUT',
      { serviceName, timeout },
    );
  }
}

// Rate limiting exceptions
export class RateLimitExceededException extends LowcodeException {
  constructor(limit: number, windowMs: number) {
    super(
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      HttpStatus.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED',
      { limit, windowMs },
    );
  }
}

// Authentication and authorization exceptions
export class UnauthorizedException extends LowcodeException {
  constructor(message: string = 'Unauthorized access') {
    super(
      message,
      HttpStatus.UNAUTHORIZED,
      'UNAUTHORIZED',
    );
  }
}

export class ForbiddenException extends LowcodeException {
  constructor(resource: string, action: string) {
    super(
      `Access forbidden: cannot ${action} ${resource}`,
      HttpStatus.FORBIDDEN,
      'FORBIDDEN',
      { resource, action },
    );
  }
}

// Configuration exceptions
export class ConfigurationException extends LowcodeException {
  constructor(configKey: string, error: string) {
    super(
      `Configuration error for key '${configKey}': ${error}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'CONFIGURATION_ERROR',
      { configKey, error },
    );
  }
}

export class MissingConfigurationException extends LowcodeException {
  constructor(configKey: string) {
    super(
      `Missing required configuration: ${configKey}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'MISSING_CONFIGURATION',
      { configKey },
    );
  }
}

// Business logic exceptions
export class BusinessRuleViolationException extends LowcodeException {
  constructor(rule: string, details?: any) {
    super(
      `Business rule violation: ${rule}`,
      HttpStatus.BAD_REQUEST,
      'BUSINESS_RULE_VIOLATION',
      { rule, details },
    );
  }
}

export class ConcurrencyException extends LowcodeException {
  constructor(resource: string, resourceId: string) {
    super(
      `Concurrency conflict: ${resource} ${resourceId} was modified by another user`,
      HttpStatus.CONFLICT,
      'CONCURRENCY_CONFLICT',
      { resource, resourceId },
    );
  }
}

export class ResourceLockedException extends LowcodeException {
  constructor(resource: string, resourceId: string, lockedBy: string) {
    super(
      `Resource locked: ${resource} ${resourceId} is locked by ${lockedBy}`,
      HttpStatus.LOCKED,
      'RESOURCE_LOCKED',
      { resource, resourceId, lockedBy },
    );
  }
}

// Utility function to create exception from error
export function createLowcodeException(error: any): LowcodeException {
  if (error instanceof LowcodeException) {
    return error;
  }

  if (error instanceof HttpException) {
    return new LowcodeException(
      error.message,
      error.getStatus(),
      'HTTP_EXCEPTION',
      error.getResponse(),
    );
  }

  // Handle common Node.js errors
  if (error.code === 'ENOENT') {
    return new FileNotFoundException(error.path);
  }

  if (error.code === 'EACCES') {
    return new InsufficientPermissionsException('access', error.path);
  }

  if (error.code === 'ECONNREFUSED') {
    return new DatabaseConnectionException(error.message);
  }

  // Default to internal server error
  return new LowcodeException(
    error.message || 'An unexpected error occurred',
    HttpStatus.INTERNAL_SERVER_ERROR,
    'UNKNOWN_ERROR',
    { originalError: error.toString() },
  );
}
