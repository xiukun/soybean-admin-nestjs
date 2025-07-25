import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnifiedJwtService } from './unified-jwt.service';
import { JWT_CONFIG_TOKEN } from '../constants/jwt.constants';

describe('UnifiedJwtService', () => {
  let service: UnifiedJwtService;
  let jwtService: JwtService;

  const mockJwtConfig = {
    accessTokenSecret: 'test-access-secret',
    refreshTokenSecret: 'test-refresh-secret',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnifiedJwtService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: JWT_CONFIG_TOKEN,
          useValue: mockJwtConfig,
        },
      ],
    }).compile();

    service = module.get<UnifiedJwtService>(UnifiedJwtService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', async () => {
      const payload = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'test.com',
      };

      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = await service.generateTokenPair(payload);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(1, payload, {
        secret: mockJwtConfig.accessTokenSecret,
        expiresIn: mockJwtConfig.accessTokenExpiresIn,
      });
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(2, payload, {
        secret: mockJwtConfig.refreshTokenSecret,
        expiresIn: mockJwtConfig.refreshTokenExpiresIn,
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token successfully', async () => {
      const token = 'valid-access-token';
      const expectedPayload = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'test.com',
      };

      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = await service.verifyAccessToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token, {
        secret: mockJwtConfig.accessTokenSecret,
      });
    });

    it('should throw error for invalid access token', async () => {
      const token = 'invalid-access-token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyAccessToken(token)).rejects.toThrow('Invalid token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', async () => {
      const token = 'valid-refresh-token';
      const expectedPayload = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'test.com',
      };

      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = await service.verifyRefreshToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token, {
        secret: mockJwtConfig.refreshTokenSecret,
      });
    });

    it('should throw error for invalid refresh token', async () => {
      const token = 'invalid-refresh-token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(service.verifyRefreshToken(token)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'test.com',
      };

      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      // Mock verify refresh token
      mockJwtService.verify.mockReturnValue(payload);
      
      // Mock generate new tokens
      mockJwtService.sign
        .mockReturnValueOnce(newAccessToken)
        .mockReturnValueOnce(newRefreshToken);

      const result = await service.refreshToken(refreshToken);

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: mockJwtConfig.refreshTokenSecret,
      });
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('decodeToken', () => {
    it('should decode token successfully', () => {
      const token = 'valid-token';
      const expectedPayload = {
        uid: 'user-123',
        username: 'testuser',
        domain: 'test.com',
      };

      mockJwtService.decode.mockReturnValue(expectedPayload);

      const result = service.decodeToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token = {
        exp: futureTimestamp,
      };

      const result = service.isTokenExpired(token);

      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = {
        exp: pastTimestamp,
      };

      const result = service.isTokenExpired(token);

      expect(result).toBe(true);
    });

    it('should return true for token without exp field', () => {
      const token = {
        uid: 'user-123',
      };

      const result = service.isTokenExpired(token);

      expect(result).toBe(true);
    });
  });
});
