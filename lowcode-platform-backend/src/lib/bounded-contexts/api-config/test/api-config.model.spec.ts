import { ApiConfig, ApiMethod, ApiStatus, ParameterType, ParameterLocation } from '@lib/bounded-contexts/api-config/domain/api-config.model';

describe('ApiConfig Model', () => {
  describe('create', () => {
    it('should create an API config with valid data', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        description: 'Get list of users',
        createdBy: 'user123',
      };

      const apiConfig = ApiConfig.create(apiConfigData);

      expect(apiConfig.projectId).toBe(apiConfigData.projectId);
      expect(apiConfig.name).toBe(apiConfigData.name);
      expect(apiConfig.code).toBe(apiConfigData.code);
      expect(apiConfig.method).toBe(apiConfigData.method);
      expect(apiConfig.path).toBe(apiConfigData.path);
      expect(apiConfig.description).toBe(apiConfigData.description);
      expect(apiConfig.createdBy).toBe(apiConfigData.createdBy);
      expect(apiConfig.status).toBe(ApiStatus.DRAFT);
      expect(apiConfig.version).toBe('1.0.0');
      expect(apiConfig.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when projectId is empty', () => {
      const apiConfigData = {
        projectId: '',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('Project ID is required');
    });

    it('should throw error when name is empty', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: '',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('API name is required');
    });

    it('should throw error when code is empty', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: '',
        method: ApiMethod.GET,
        path: '/users',
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('API code is required');
    });

    it('should throw error when path is empty', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '',
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('API path is required');
    });

    it('should throw error when path does not start with /', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: 'users',
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('API path must start with /');
    });

    it('should throw error when code has invalid format', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: '123invalid',
        method: ApiMethod.GET,
        path: '/users',
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow(
        'API code must start with a letter and contain only letters, numbers, and underscores'
      );
    });

    it('should throw error when HTTP method is invalid', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: 'INVALID' as any,
        path: '/users',
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('Invalid HTTP method');
    });

    it('should validate parameters', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        parameters: [
          {
            name: '',
            type: ParameterType.STRING,
            location: ParameterLocation.QUERY,
            required: false,
          }
        ],
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('Parameter 1 name is required');
    });

    it('should validate parameter types', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        parameters: [
          {
            name: 'page',
            type: 'INVALID' as any,
            location: ParameterLocation.QUERY,
            required: false,
          }
        ],
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('Invalid parameter type for page');
    });

    it('should validate parameter locations', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        parameters: [
          {
            name: 'page',
            type: ParameterType.INTEGER,
            location: 'INVALID' as any,
            required: false,
          }
        ],
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('Invalid parameter location for page');
    });

    it('should validate responses', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        responses: [
          {
            statusCode: 999,
            description: 'Invalid status code',
          }
        ],
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('Invalid status code for response 1');
    });

    it('should validate response descriptions', () => {
      const apiConfigData = {
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        responses: [
          {
            statusCode: 200,
            description: '',
          }
        ],
        createdBy: 'user123',
      };

      expect(() => ApiConfig.create(apiConfigData)).toThrow('Response 1 description is required');
    });
  });

  describe('update', () => {
    let apiConfig: ApiConfig;

    beforeEach(() => {
      apiConfig = ApiConfig.create({
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        createdBy: 'user123',
      });
    });

    it('should update API config properties', () => {
      const updateData = {
        name: 'Updated Get Users',
        description: 'Updated description',
        path: '/api/users',
        updatedBy: 'user456',
      };

      apiConfig.update(updateData);

      expect(apiConfig.name).toBe(updateData.name);
      expect(apiConfig.description).toBe(updateData.description);
      expect(apiConfig.path).toBe(updateData.path);
      expect(apiConfig.updatedBy).toBe(updateData.updatedBy);
      expect(apiConfig.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate name when updating', () => {
      expect(() => {
        apiConfig.update({ name: '', updatedBy: 'user456' });
      }).toThrow('API name is required');
    });

    it('should validate path when updating', () => {
      expect(() => {
        apiConfig.update({ path: 'invalid-path', updatedBy: 'user456' });
      }).toThrow('API path must start with /');
    });
  });

  describe('business methods', () => {
    let apiConfig: ApiConfig;

    beforeEach(() => {
      apiConfig = ApiConfig.create({
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        createdBy: 'user123',
      });
    });

    describe('status management', () => {
      it('should check if API is draft', () => {
        expect(apiConfig.isDraft()).toBe(true);
        expect(apiConfig.isPublished()).toBe(false);
        expect(apiConfig.isDeprecated()).toBe(false);
      });

      it('should publish API', () => {
        apiConfig.publish();

        expect(apiConfig.status).toBe(ApiStatus.PUBLISHED);
        expect(apiConfig.isPublished()).toBe(true);
        expect(apiConfig.updatedAt).toBeInstanceOf(Date);
      });

      it('should deprecate API', () => {
        apiConfig.deprecate();

        expect(apiConfig.status).toBe(ApiStatus.DEPRECATED);
        expect(apiConfig.isDeprecated()).toBe(true);
        expect(apiConfig.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when publishing already published API', () => {
        apiConfig.publish();
        expect(() => apiConfig.publish()).toThrow('API is already published');
      });

      it('should throw error when deprecating already deprecated API', () => {
        apiConfig.deprecate();
        expect(() => apiConfig.deprecate()).toThrow('API is already deprecated');
      });
    });

    describe('utility methods', () => {
      it('should generate full path', () => {
        expect(apiConfig.getFullPath()).toBe('/api/v1/users');
      });

      it('should check if API has parameters', () => {
        expect(apiConfig.hasParameters()).toBe(false);

        apiConfig.update({
          parameters: [
            {
              name: 'page',
              type: ParameterType.INTEGER,
              location: ParameterLocation.QUERY,
              required: false,
            }
          ]
        });

        expect(apiConfig.hasParameters()).toBe(true);
      });

      it('should get required parameters', () => {
        apiConfig.update({
          parameters: [
            {
              name: 'page',
              type: ParameterType.INTEGER,
              location: ParameterLocation.QUERY,
              required: false,
            },
            {
              name: 'id',
              type: ParameterType.STRING,
              location: ParameterLocation.PATH,
              required: true,
            }
          ]
        });

        const requiredParams = apiConfig.getRequiredParameters();
        expect(requiredParams).toHaveLength(1);
        expect(requiredParams[0].name).toBe('id');
      });

      it('should get parameters by location', () => {
        apiConfig.update({
          parameters: [
            {
              name: 'page',
              type: ParameterType.INTEGER,
              location: ParameterLocation.QUERY,
              required: false,
            },
            {
              name: 'id',
              type: ParameterType.STRING,
              location: ParameterLocation.PATH,
              required: true,
            }
          ]
        });

        const queryParams = apiConfig.getParametersByLocation(ParameterLocation.QUERY);
        expect(queryParams).toHaveLength(1);
        expect(queryParams[0].name).toBe('page');

        const pathParams = apiConfig.getParametersByLocation(ParameterLocation.PATH);
        expect(pathParams).toHaveLength(1);
        expect(pathParams[0].name).toBe('id');
      });

      it('should check if API has authentication', () => {
        expect(apiConfig.hasAuthentication()).toBe(false);

        apiConfig.update({
          security: { type: 'jwt' }
        });

        expect(apiConfig.hasAuthentication()).toBe(true);
      });

      it('should check if API can be deleted', () => {
        expect(apiConfig.canDelete()).toBe(true);

        apiConfig.publish();
        expect(apiConfig.canDelete()).toBe(false);
      });
    });
  });

  describe('fromPersistence', () => {
    it('should create API config from persistence data', () => {
      const persistenceData = {
        id: 'api-config-id-123',
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        description: 'Get list of users',
        method: ApiMethod.GET,
        path: '/users',
        entityId: 'entity-123',
        parameters: [],
        responses: [],
        security: { type: 'none' as const },
        config: {},
        status: ApiStatus.PUBLISHED,
        version: '1.0.0',
        createdBy: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedBy: 'user456',
        updatedAt: new Date('2024-01-02'),
      };

      const apiConfig = ApiConfig.fromPersistence(persistenceData);

      expect(apiConfig.id).toBe(persistenceData.id);
      expect(apiConfig.projectId).toBe(persistenceData.projectId);
      expect(apiConfig.name).toBe(persistenceData.name);
      expect(apiConfig.code).toBe(persistenceData.code);
      expect(apiConfig.description).toBe(persistenceData.description);
      expect(apiConfig.method).toBe(persistenceData.method);
      expect(apiConfig.path).toBe(persistenceData.path);
      expect(apiConfig.entityId).toBe(persistenceData.entityId);
      expect(apiConfig.status).toBe(persistenceData.status);
      expect(apiConfig.version).toBe(persistenceData.version);
      expect(apiConfig.createdBy).toBe(persistenceData.createdBy);
      expect(apiConfig.createdAt).toBe(persistenceData.createdAt);
      expect(apiConfig.updatedBy).toBe(persistenceData.updatedBy);
      expect(apiConfig.updatedAt).toBe(persistenceData.updatedAt);
    });
  });

  describe('toJSON', () => {
    it('should return API config as JSON object', () => {
      const apiConfig = ApiConfig.create({
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        description: 'Get list of users',
        createdBy: 'user123',
      });

      const json = apiConfig.toJSON();

      expect(json).toHaveProperty('projectId', 'project-123');
      expect(json).toHaveProperty('name', 'Get Users');
      expect(json).toHaveProperty('code', 'getUsers');
      expect(json).toHaveProperty('method', ApiMethod.GET);
      expect(json).toHaveProperty('path', '/users');
      expect(json).toHaveProperty('description', 'Get list of users');
      expect(json).toHaveProperty('createdBy', 'user123');
      expect(json).toHaveProperty('status', ApiStatus.DRAFT);
      expect(json).toHaveProperty('version', '1.0.0');
      expect(json).toHaveProperty('createdAt');
    });
  });

  describe('amis compliance', () => {
    let apiConfig: ApiConfig;

    beforeEach(() => {
      apiConfig = ApiConfig.create({
        projectId: 'project-123',
        name: 'Get Users',
        code: 'getUsers',
        method: ApiMethod.GET,
        path: '/users',
        createdBy: 'user123',
      });
    });

    describe('isAmisCompliant', () => {
      it('should return false for API without amis format response', () => {
        expect(apiConfig.isAmisCompliant()).toBe(false);
      });

      it('should return true for API with amis format response', () => {
        apiConfig.update({
          responses: [
            {
              statusCode: 200,
              description: 'Success',
              amisFormat: true
            }
          ]
        });

        expect(apiConfig.isAmisCompliant()).toBe(true);
      });
    });

    describe('generateAmisResponse', () => {
      it('should wrap string data with key', () => {
        const result = apiConfig.generateAmisResponse('Hello World');

        expect(result).toEqual({
          status: 0,
          msg: '',
          data: {
            text: 'Hello World'
          }
        });
      });

      it('should wrap string data with custom key', () => {
        const result = apiConfig.generateAmisResponse('Hello World', 'message');

        expect(result).toEqual({
          status: 0,
          msg: '',
          data: {
            message: 'Hello World'
          }
        });
      });

      it('should wrap array data with key', () => {
        const result = apiConfig.generateAmisResponse(['item1', 'item2']);

        expect(result).toEqual({
          status: 0,
          msg: '',
          data: {
            items: ['item1', 'item2']
          }
        });
      });

      it('should wrap array data with custom key', () => {
        const result = apiConfig.generateAmisResponse(['item1', 'item2'], 'list');

        expect(result).toEqual({
          status: 0,
          msg: '',
          data: {
            list: ['item1', 'item2']
          }
        });
      });

      it('should wrap object data directly', () => {
        const data = { id: 1, name: 'Test' };
        const result = apiConfig.generateAmisResponse(data);

        expect(result).toEqual({
          status: 0,
          msg: '',
          data: data
        });
      });

      it('should handle null/undefined data', () => {
        const result = apiConfig.generateAmisResponse(null);

        expect(result).toEqual({
          status: 0,
          msg: '',
          data: {}
        });
      });
    });

    describe('generateAmisErrorResponse', () => {
      it('should generate error response with default status', () => {
        const result = apiConfig.generateAmisErrorResponse('Something went wrong');

        expect(result).toEqual({
          status: 1,
          msg: 'Something went wrong',
          data: {}
        });
      });

      it('should generate error response with custom status', () => {
        const result = apiConfig.generateAmisErrorResponse('Validation failed', 400);

        expect(result).toEqual({
          status: 400,
          msg: 'Validation failed',
          data: {}
        });
      });
    });

    describe('generateAmisPaginationResponse', () => {
      it('should generate pagination response with new parameter names', () => {
        const items = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ];
        const result = apiConfig.generateAmisPaginationResponse(items, 1, 10, 100);

        expect(result).toEqual({
          status: 0,
          msg: '',
          data: {
            options: items,
            page: 1,
            perPage: 10,
            total: 100
          }
        });
      });
    });

    describe('validateAmisResponseSchema', () => {
      it('should return false for invalid schema', () => {
        expect(apiConfig.validateAmisResponseSchema(null)).toBe(false);
        expect(apiConfig.validateAmisResponseSchema({})).toBe(false);
        expect(apiConfig.validateAmisResponseSchema('invalid')).toBe(false);
      });

      it('should return true for valid amis response schema', () => {
        const schema = {
          type: 'object',
          properties: {
            status: { type: 'number' },
            msg: { type: 'string' },
            data: { type: 'object' }
          }
        };

        expect(apiConfig.validateAmisResponseSchema(schema)).toBe(true);
      });

      it('should return false for schema missing required properties', () => {
        const schema = {
          type: 'object',
          properties: {
            status: { type: 'number' },
            msg: { type: 'string' }
            // missing data property
          }
        };

        expect(apiConfig.validateAmisResponseSchema(schema)).toBe(false);
      });
    });
  });
});
