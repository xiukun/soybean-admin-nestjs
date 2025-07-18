import { AmisResponseUtil } from '@lib/bounded-contexts/api-config/domain/amis-response.util';

describe('AmisResponseUtil', () => {
  describe('success', () => {
    it('should wrap string data with default key', () => {
      const result = AmisResponseUtil.success('Hello World');
      
      expect(result).toEqual({
        status: 0,
        msg: '',
        data: {
          text: 'Hello World'
        }
      });
    });

    it('should wrap string data with custom key', () => {
      const result = AmisResponseUtil.success('Hello World', 'message');
      
      expect(result).toEqual({
        status: 0,
        msg: '',
        data: {
          message: 'Hello World'
        }
      });
    });

    it('should wrap array data with default key', () => {
      const result = AmisResponseUtil.success(['item1', 'item2']);
      
      expect(result).toEqual({
        status: 0,
        msg: '',
        data: {
          items: ['item1', 'item2']
        }
      });
    });

    it('should wrap array data with custom key', () => {
      const result = AmisResponseUtil.success(['item1', 'item2'], 'list');
      
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
      const result = AmisResponseUtil.success(data);
      
      expect(result).toEqual({
        status: 0,
        msg: '',
        data: data
      });
    });

    it('should handle null/undefined data', () => {
      const result = AmisResponseUtil.success(null);
      
      expect(result).toEqual({
        status: 0,
        msg: '',
        data: {}
      });
    });
  });

  describe('error', () => {
    it('should generate error response with default status', () => {
      const result = AmisResponseUtil.error('Something went wrong');
      
      expect(result).toEqual({
        status: 1,
        msg: 'Something went wrong',
        data: {}
      });
    });

    it('should generate error response with custom status', () => {
      const result = AmisResponseUtil.error('Validation failed', 400);
      
      expect(result).toEqual({
        status: 400,
        msg: 'Validation failed',
        data: {}
      });
    });
  });

  describe('pagination', () => {
    it('should generate pagination response with new parameter names', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
      const result = AmisResponseUtil.pagination(items, 1, 10, 100);

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

    it('should handle empty items array', () => {
      const result = AmisResponseUtil.pagination([], 1, 10, 0);

      expect(result).toEqual({
        status: 0,
        msg: '',
        data: {
          options: [],
          page: 1,
          perPage: 10,
          total: 0
        }
      });
    });
  });

  describe('needsWrapping', () => {
    it('should return true for string data', () => {
      expect(AmisResponseUtil.needsWrapping('test')).toBe(true);
    });

    it('should return true for array data', () => {
      expect(AmisResponseUtil.needsWrapping(['a', 'b'])).toBe(true);
    });

    it('should return false for object data', () => {
      expect(AmisResponseUtil.needsWrapping({ key: 'value' })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(AmisResponseUtil.needsWrapping(null)).toBe(false);
      expect(AmisResponseUtil.needsWrapping(undefined)).toBe(false);
    });

    it('should return false for number/boolean', () => {
      expect(AmisResponseUtil.needsWrapping(123)).toBe(false);
      expect(AmisResponseUtil.needsWrapping(true)).toBe(false);
    });
  });

  describe('isValidAmisResponse', () => {
    it('should return true for valid amis response', () => {
      const response = {
        status: 0,
        msg: '',
        data: { key: 'value' }
      };
      
      expect(AmisResponseUtil.isValidAmisResponse(response)).toBe(true);
    });

    it('should return false for response with string data', () => {
      const response = {
        status: 0,
        msg: '',
        data: 'invalid string data'
      };
      
      expect(AmisResponseUtil.isValidAmisResponse(response)).toBe(false);
    });

    it('should return false for response with array data', () => {
      const response = {
        status: 0,
        msg: '',
        data: ['invalid', 'array', 'data']
      };
      
      expect(AmisResponseUtil.isValidAmisResponse(response)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      expect(AmisResponseUtil.isValidAmisResponse({})).toBe(false);
      expect(AmisResponseUtil.isValidAmisResponse({ status: 0 })).toBe(false);
      expect(AmisResponseUtil.isValidAmisResponse({ status: 0, msg: '' })).toBe(false);
    });

    it('should return false for invalid field types', () => {
      const response = {
        status: '0', // should be number
        msg: '',
        data: {}
      };
      
      expect(AmisResponseUtil.isValidAmisResponse(response)).toBe(false);
    });

    it('should return false for null/undefined response', () => {
      expect(AmisResponseUtil.isValidAmisResponse(null)).toBe(false);
      expect(AmisResponseUtil.isValidAmisResponse(undefined)).toBe(false);
    });
  });

  describe('isValidAmisPaginationResponse', () => {
    it('should return true for valid pagination response with new parameter names', () => {
      const response = {
        status: 0,
        msg: '',
        data: {
          options: [{ id: 1 }],
          page: 1,
          perPage: 10,
          total: 100
        }
      };

      expect(AmisResponseUtil.isValidAmisPaginationResponse(response)).toBe(true);
    });

    it('should return true for valid pagination response with legacy parameter names', () => {
      const response = {
        status: 0,
        msg: '',
        data: {
          options: [{ id: 1 }],
          pageNum: 1,
          pageSize: 10,
          total: 100
        }
      };

      expect(AmisResponseUtil.isValidAmisPaginationResponse(response)).toBe(true);
    });

    it('should return false for missing pagination fields', () => {
      const response = {
        status: 0,
        msg: '',
        data: {
          options: [{ id: 1 }]
          // missing page/pageNum, perPage/pageSize, total
        }
      };

      expect(AmisResponseUtil.isValidAmisPaginationResponse(response)).toBe(false);
    });

    it('should return false for invalid field types', () => {
      const response = {
        status: 0,
        msg: '',
        data: {
          options: 'not an array',
          pageNum: 1,
          pageSize: 10,
          total: 100
        }
      };
      
      expect(AmisResponseUtil.isValidAmisPaginationResponse(response)).toBe(false);
    });
  });

  describe('convertToAmisFormat', () => {
    it('should return valid amis response as-is', () => {
      const response = {
        status: 0,
        msg: '',
        data: { key: 'value' }
      };
      
      const result = AmisResponseUtil.convertToAmisFormat(response);
      expect(result).toEqual(response);
    });

    it('should convert plain object to amis format', () => {
      const data = { id: 1, name: 'Test' };
      const result = AmisResponseUtil.convertToAmisFormat(data);
      
      expect(result).toEqual({
        status: 0,
        msg: '',
        data: data
      });
    });

    it('should convert string to amis format', () => {
      const result = AmisResponseUtil.convertToAmisFormat('Hello World');
      
      expect(result).toEqual({
        status: 0,
        msg: '',
        data: {
          text: 'Hello World'
        }
      });
    });

    it('should convert array to amis format', () => {
      const result = AmisResponseUtil.convertToAmisFormat(['item1', 'item2']);
      
      expect(result).toEqual({
        status: 0,
        msg: '',
        data: {
          items: ['item1', 'item2']
        }
      });
    });
  });

  describe('generateAmisResponseSchema', () => {
    it('should generate basic amis response schema', () => {
      const schema = AmisResponseUtil.generateAmisResponseSchema();
      
      expect(schema).toEqual({
        type: 'object',
        required: ['status', 'msg', 'data'],
        properties: {
          status: {
            type: 'number',
            description: '状态码，0表示成功，非0表示失败'
          },
          msg: {
            type: 'string',
            description: '消息内容'
          },
          data: {
            type: 'object',
            description: '响应数据'
          }
        }
      });
    });

    it('should generate amis response schema with custom data schema', () => {
      const dataSchema = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' }
        }
      };
      
      const schema = AmisResponseUtil.generateAmisResponseSchema(dataSchema);
      
      expect(schema.properties.data).toEqual(dataSchema);
    });
  });

  describe('generateAmisPaginationSchema', () => {
    it('should generate pagination schema with new parameter names', () => {
      const schema = AmisResponseUtil.generateAmisPaginationSchema();

      expect(schema.properties.data.properties).toHaveProperty('options');
      expect(schema.properties.data.properties).toHaveProperty('page');
      expect(schema.properties.data.properties).toHaveProperty('perPage');
      expect(schema.properties.data.properties).toHaveProperty('total');
    });

    it('should generate legacy pagination schema', () => {
      const schema = AmisResponseUtil.generateAmisPaginationSchemaLegacy();

      expect(schema.properties.data.properties).toHaveProperty('options');
      expect(schema.properties.data.properties).toHaveProperty('pageNum');
      expect(schema.properties.data.properties).toHaveProperty('pageSize');
      expect(schema.properties.data.properties).toHaveProperty('total');
    });

    it('should generate pagination schema with custom item schema', () => {
      const itemSchema = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' }
        }
      };
      
      const schema = AmisResponseUtil.generateAmisPaginationSchema(itemSchema);
      
      expect(schema.properties.data.properties.options.items).toEqual(itemSchema);
    });
  });

  describe('getExamples', () => {
    it('should return valid examples', () => {
      const examples = AmisResponseUtil.getExamples();
      
      expect(AmisResponseUtil.isValidAmisResponse(examples.success)).toBe(true);
      expect(AmisResponseUtil.isValidAmisResponse(examples.error)).toBe(true);
      expect(AmisResponseUtil.isValidAmisResponse(examples.stringData)).toBe(true);
      expect(AmisResponseUtil.isValidAmisResponse(examples.arrayData)).toBe(true);
      expect(AmisResponseUtil.isValidAmisPaginationResponse(examples.pagination)).toBe(true);

      // 验证分页示例使用的是新的参数名
      expect(examples.pagination.data).toHaveProperty('page');
      expect(examples.pagination.data).toHaveProperty('perPage');
    });
  });
});
