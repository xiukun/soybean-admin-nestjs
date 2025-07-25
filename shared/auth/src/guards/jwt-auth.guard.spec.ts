import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UnifiedJwtService } from '../services/unified-jwt.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let unifiedJwtService: UnifiedJwtService;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockUnifiedJwtService = {
    verifyAccessToken: jest.fn(),
    isTokenRevoked: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: UnifiedJwtService,
          useValue: mockUnifiedJwtService,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
    unifiedJwtService = module.get<UnifiedJwtService>(UnifiedJwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [mockExecutionContext.getHandler(), mockExecutionContext.getClass()]
      );
    });

    it('should call parent canActivate for protected routes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      
      // Mock the parent canActivate method
      const parentCanActivate = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      parentCanActivate.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(parentCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });
  });

  describe('validate', () => {
    it('should validate token successfully', async () => {
      const payload = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'test.com',
      };

      mockUnifiedJwtService.verifyAccessToken.mockResolvedValue(payload);
      mockUnifiedJwtService.isTokenRevoked.mockResolvedValue(false);

      const result = await guard.validate(payload);

      expect(result).toEqual(payload);
      expect(mockUnifiedJwtService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockUnifiedJwtService.isTokenRevoked).toHaveBeenCalledWith('user-123');
    });

    it('should throw error for revoked token', async () => {
      const payload = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'test.com',
      };

      mockUnifiedJwtService.isTokenRevoked.mockResolvedValue(true);

      await expect(guard.validate(payload)).rejects.toThrow('Token has been revoked');
    });
  });

  describe('getRequest', () => {
    it('should extract request from execution context', () => {
      const mockRequest = { headers: { authorization: 'Bearer token' } };
      const mockHttpContext = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };
      
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue(mockHttpContext);

      const result = guard.getRequest(mockExecutionContext);

      expect(result).toBe(mockRequest);
      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(mockHttpContext.getRequest).toHaveBeenCalled();
    });
  });
});
