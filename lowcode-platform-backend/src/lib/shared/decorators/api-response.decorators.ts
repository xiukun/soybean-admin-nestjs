import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiTooManyRequestsResponse,
  getSchemaPath,
} from '@nestjs/swagger';

// Standard API response wrapper
export interface StandardApiResponse<T = any> {
  status: 0 | 1;
  msg: string;
  data: T;
}

export interface ErrorApiResponse {
  status: 1;
  msg: 'error';
  data: null;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
  };
}

export interface PaginatedApiResponse<T = any> {
  status: 0;
  msg: 'success';
  data: {
    records: T[];
    meta: {
      current: number;
      size: number;
      total: number;
      pages: number;
    };
  };
}

/**
 * Standard success response decorator
 */
export const ApiSuccessResponse = <TModel extends Type<any>>(
  model?: TModel,
  description?: string,
  isArray?: boolean,
) => {
  const responseSchema = model
    ? {
        allOf: [
          { $ref: getSchemaPath('ApiResponse') },
          {
            properties: {
              data: isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  }
                : { $ref: getSchemaPath(model) },
            },
          },
        ],
      }
    : {
        $ref: getSchemaPath('ApiResponse'),
      };

  return ApiOkResponse({
    description: description || 'Success',
    schema: responseSchema,
  });
};

/**
 * Standard created response decorator
 */
export const ApiCreatedSuccessResponse = <TModel extends Type<any>>(
  model?: TModel,
  description?: string,
) => {
  const responseSchema = model
    ? {
        allOf: [
          { $ref: getSchemaPath('ApiResponse') },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      }
    : {
        $ref: getSchemaPath('ApiResponse'),
      };

  return ApiCreatedResponse({
    description: description || 'Created successfully',
    schema: responseSchema,
  });
};

/**
 * Paginated response decorator
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description?: string,
) => {
  return ApiOkResponse({
    description: description || 'Paginated results',
    schema: {
      allOf: [
        { $ref: getSchemaPath('PaginatedResponse') },
        {
          properties: {
            data: {
              properties: {
                records: {
                  type: 'array',
                  items: { $ref: getSchemaPath(model) },
                },
              },
            },
          },
        },
      ],
    },
  });
};

/**
 * Standard error responses decorator
 */
export const ApiStandardErrorResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request - Validation failed or invalid input',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Authentication required',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Insufficient permissions',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error - Unexpected server error',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
  );
};

/**
 * CRUD operation responses decorator
 */
export const ApiCrudResponses = <TModel extends Type<any>>(
  model: TModel,
  entityName: string,
) => {
  return applyDecorators(
    ApiSuccessResponse(model, `${entityName} retrieved successfully`),
    ApiNotFoundResponse({
      description: `${entityName} not found`,
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiStandardErrorResponses(),
  );
};

/**
 * Create operation responses decorator
 */
export const ApiCreateResponses = <TModel extends Type<any>>(
  model: TModel,
  entityName: string,
) => {
  return applyDecorators(
    ApiCreatedSuccessResponse(model, `${entityName} created successfully`),
    ApiConflictResponse({
      description: `${entityName} already exists`,
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiStandardErrorResponses(),
  );
};

/**
 * Update operation responses decorator
 */
export const ApiUpdateResponses = <TModel extends Type<any>>(
  model: TModel,
  entityName: string,
) => {
  return applyDecorators(
    ApiSuccessResponse(model, `${entityName} updated successfully`),
    ApiNotFoundResponse({
      description: `${entityName} not found`,
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiConflictResponse({
      description: `${entityName} update conflict`,
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiStandardErrorResponses(),
  );
};

/**
 * Delete operation responses decorator
 */
export const ApiDeleteResponses = (entityName: string) => {
  return applyDecorators(
    ApiSuccessResponse(undefined, `${entityName} deleted successfully`),
    ApiNotFoundResponse({
      description: `${entityName} not found`,
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiStandardErrorResponses(),
  );
};

/**
 * List operation responses decorator
 */
export const ApiListResponses = <TModel extends Type<any>>(
  model: TModel,
  entityName: string,
) => {
  return applyDecorators(
    ApiPaginatedResponse(model, `${entityName} list retrieved successfully`),
    ApiStandardErrorResponses(),
  );
};

/**
 * Authentication required decorator
 */
export const ApiAuthRequired = () => {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Authentication required',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiForbiddenResponse({
      description: 'Insufficient permissions',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
  );
};

/**
 * Rate limited endpoint decorator
 */
export const ApiRateLimited = () => {
  return ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
    schema: { $ref: getSchemaPath('ErrorResponse') },
  });
};

/**
 * File upload responses decorator
 */
export const ApiFileUploadResponses = () => {
  return applyDecorators(
    ApiSuccessResponse(undefined, 'File uploaded successfully'),
    ApiBadRequestResponse({
      description: 'Invalid file format or size',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiStandardErrorResponses(),
  );
};

/**
 * Async operation responses decorator
 */
export const ApiAsyncOperationResponses = () => {
  return applyDecorators(
    ApiResponse({
      status: 202,
      description: 'Operation accepted and will be processed asynchronously',
      schema: {
        allOf: [
          { $ref: getSchemaPath('ApiResponse') },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  taskId: {
                    type: 'string',
                    description: 'Task ID for tracking operation status',
                    example: '01HQZX1234567890ABCDEF',
                  },
                  status: {
                    type: 'string',
                    enum: ['pending', 'processing', 'completed', 'failed'],
                    description: 'Current operation status',
                  },
                  estimatedDuration: {
                    type: 'number',
                    description: 'Estimated duration in seconds',
                    example: 30,
                  },
                },
              },
            },
          },
        ],
      },
    }),
    ApiStandardErrorResponses(),
  );
};

/**
 * Health check responses decorator
 */
export const ApiHealthCheckResponses = () => {
  return applyDecorators(
    ApiOkResponse({
      description: 'Health check passed',
      schema: {
        allOf: [
          { $ref: getSchemaPath('ApiResponse') },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'degraded', 'unhealthy'],
                    description: 'Overall system health status',
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Health check timestamp',
                  },
                  uptime: {
                    type: 'number',
                    description: 'System uptime in seconds',
                  },
                  version: {
                    type: 'string',
                    description: 'Application version',
                  },
                  services: {
                    type: 'object',
                    description: 'Individual service health status',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['healthy', 'unhealthy'],
                        },
                        responseTime: {
                          type: 'number',
                          description: 'Response time in milliseconds',
                        },
                        details: {
                          type: 'object',
                          description: 'Additional service details',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Health check failed',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
  );
};
