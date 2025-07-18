import { PaginationParamsDto, PaginationResponseDto, LegacyPaginationParamsDto, PaginationUtil } from '@dto/pagination.dto';

describe('PaginationParamsDto', () => {
  describe('constructor and defaults', () => {
    it('should have default values', () => {
      const params = new PaginationParamsDto();
      
      expect(params.page).toBe(1);
      expect(params.perPage).toBe(10);
    });
  });

  describe('getSkip', () => {
    it('should calculate skip correctly', () => {
      const params = new PaginationParamsDto();
      params.page = 3;
      params.perPage = 20;
      
      expect(params.getSkip()).toBe(40); // (3-1) * 20
    });

    it('should return 0 for first page', () => {
      const params = new PaginationParamsDto();
      params.page = 1;
      params.perPage = 10;
      
      expect(params.getSkip()).toBe(0);
    });
  });

  describe('getLimit', () => {
    it('should return perPage value', () => {
      const params = new PaginationParamsDto();
      params.perPage = 25;
      
      expect(params.getLimit()).toBe(25);
    });
  });

  describe('getTotalPages', () => {
    it('should calculate total pages correctly', () => {
      const params = new PaginationParamsDto();
      params.perPage = 10;
      
      expect(params.getTotalPages(100)).toBe(10);
      expect(params.getTotalPages(95)).toBe(10);
      expect(params.getTotalPages(101)).toBe(11);
      expect(params.getTotalPages(0)).toBe(0);
    });
  });

  describe('validate', () => {
    it('should validate correct parameters', () => {
      const params = new PaginationParamsDto();
      params.page = 2;
      params.perPage = 20;
      
      const result = params.validate();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid page', () => {
      const params = new PaginationParamsDto();
      params.page = 0;
      params.perPage = 10;
      
      const result = params.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('页码不能小于1');
    });

    it('should reject invalid perPage', () => {
      const params = new PaginationParamsDto();
      params.page = 1;
      params.perPage = 0;
      
      const result = params.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('每页数量不能小于1');
    });

    it('should reject perPage over limit', () => {
      const params = new PaginationParamsDto();
      params.page = 1;
      params.perPage = 150;
      
      const result = params.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('每页数量不能超过100');
    });
  });

  describe('toAmisResponse', () => {
    it('should create amis response format', () => {
      const params = new PaginationParamsDto();
      params.page = 2;
      params.perPage = 15;
      
      const items = [{ id: 1 }, { id: 2 }];
      const total = 100;
      
      const response = params.toAmisResponse(items, total);
      
      expect(response).toEqual({
        status: 0,
        msg: '',
        data: {
          options: items,
          page: 2,
          perPage: 15,
          total: 100,
          totalPages: 7
        }
      });
    });
  });
});

describe('PaginationResponseDto', () => {
  it('should create response with calculated total pages', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const response = new PaginationResponseDto(items, 2, 15, 100);
    
    expect(response.options).toBe(items);
    expect(response.page).toBe(2);
    expect(response.perPage).toBe(15);
    expect(response.total).toBe(100);
    expect(response.totalPages).toBe(7);
  });
});

describe('LegacyPaginationParamsDto', () => {
  describe('toNewFormat', () => {
    it('should convert to new format', () => {
      const legacy = new LegacyPaginationParamsDto();
      legacy.pageNum = 3;
      legacy.pageSize = 25;
      
      const newFormat = legacy.toNewFormat();
      
      expect(newFormat.page).toBe(3);
      expect(newFormat.perPage).toBe(25);
    });
  });
});

describe('PaginationUtil', () => {
  describe('createParams', () => {
    it('should create params with default values', () => {
      const params = PaginationUtil.createParams();
      
      expect(params.page).toBe(1);
      expect(params.perPage).toBe(10);
    });

    it('should create params with custom values', () => {
      const params = PaginationUtil.createParams(3, 25);
      
      expect(params.page).toBe(3);
      expect(params.perPage).toBe(25);
    });
  });

  describe('createResponse', () => {
    it('should create response dto', () => {
      const items = [{ id: 1 }];
      const response = PaginationUtil.createResponse(items, 2, 20, 100);
      
      expect(response.options).toBe(items);
      expect(response.page).toBe(2);
      expect(response.perPage).toBe(20);
      expect(response.total).toBe(100);
      expect(response.totalPages).toBe(5);
    });
  });

  describe('createAmisResponse', () => {
    it('should create amis format response', () => {
      const items = [{ id: 1 }];
      const response = PaginationUtil.createAmisResponse(items, 2, 20, 100);
      
      expect(response).toEqual({
        status: 0,
        msg: '',
        data: {
          options: items,
          page: 2,
          perPage: 20,
          total: 100,
          totalPages: 5
        }
      });
    });
  });

  describe('validateParams', () => {
    it('should validate correct params', () => {
      const result = PaginationUtil.validateParams(2, 20);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid page', () => {
      const result = PaginationUtil.validateParams(0, 20);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('页码必须是大于0的整数');
    });

    it('should reject invalid perPage', () => {
      const result = PaginationUtil.validateParams(1, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('每页数量必须是大于0的整数');
    });

    it('should reject perPage over limit', () => {
      const result = PaginationUtil.validateParams(1, 150);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('每页数量不能超过100');
    });

    it('should reject non-integer values', () => {
      const result = PaginationUtil.validateParams(1.5, 10.5);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('页码必须是大于0的整数');
      expect(result.errors).toContain('每页数量必须是大于0的整数');
    });
  });

  describe('calculatePagination', () => {
    it('should calculate pagination info', () => {
      const info = PaginationUtil.calculatePagination(3, 20, 100);
      
      expect(info).toEqual({
        page: 3,
        perPage: 20,
        total: 100,
        totalPages: 5,
        skip: 40,
        hasNext: true,
        hasPrev: true,
        isFirstPage: false,
        isLastPage: false
      });
    });

    it('should handle first page', () => {
      const info = PaginationUtil.calculatePagination(1, 20, 100);
      
      expect(info.hasNext).toBe(true);
      expect(info.hasPrev).toBe(false);
      expect(info.isFirstPage).toBe(true);
      expect(info.isLastPage).toBe(false);
    });

    it('should handle last page', () => {
      const info = PaginationUtil.calculatePagination(5, 20, 100);
      
      expect(info.hasNext).toBe(false);
      expect(info.hasPrev).toBe(true);
      expect(info.isFirstPage).toBe(false);
      expect(info.isLastPage).toBe(true);
    });

    it('should handle single page', () => {
      const info = PaginationUtil.calculatePagination(1, 20, 15);
      
      expect(info.totalPages).toBe(1);
      expect(info.hasNext).toBe(false);
      expect(info.hasPrev).toBe(false);
      expect(info.isFirstPage).toBe(true);
      expect(info.isLastPage).toBe(true);
    });
  });
});
