import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

import { UnifiedJwtService, IAuthentication, TokenPair } from '../src/services/unified-jwt.service';
import { JWT_CONFIG_TOKEN, UnifiedJwtConfig } from '../src/config/jwt.config';

describe('UnifiedJwtService', () => {
  let service: UnifiedJwtService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtConfig: UnifiedJwtConfig = {
    accessTokenSecret: 'test-access-secret-32-characters-long',
    refreshTokenSecret: 'test-refresh-secret-32-characters-long',
    accessTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
    issuer: 'test-issuer',
    audience: 'test-audience',
    algorithm: 'HS256',
    serviceSecret: 'test-service-secret-32-characters-long',
    enableBlacklist: false,
    enableSessionManagement: false,
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0,
    },
  };

  const mockUser: IAuthentication = {
    uid: '1',
    username: 'testuser',
    domain: 'test',
    roles: ['user'],
    permissions: ['read'],
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnifiedJwtService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: JWT_CONFIG_TOKEN,
          useValue: mockJwtConfig,
        },
      ],
    }).compile();

    service = module.get<UnifiedJwtService>(UnifiedJwtService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = await service.generateTokenPair(mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        accessTokenExpiresIn: 3600, // 1h in seconds
        refreshTokenExpiresIn: 604800, // 7d in seconds
        tokenType: 'Bearer',
        user: mockUser,
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should handle token generation error', async () => {
      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      await expect(service.generateTokenPair(mockUser)).rejects.toThrow('Token generation failed');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const mockToken = 'valid-access-token';
      const mockPayload = {
        uid: '1',
        username: 'testuser',
        domain: 'test',
        type: 'access',
        iss: 'test-issuer',
        aud: 'test-audience',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: 'test-jti',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      const result = await service.verifyAccessToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: mockJwtConfig.accessTokenSecret,
      });
    });

    it('should reject invalid token type', async () => {
      const mockToken = 'invalid-token';
      const mockPayload = {
        uid: '1',
        username: 'testuser',
        domain: 'test',
        type: 'refresh', // Wrong type
        iss: 'test-issuer',
        aud: 'test-audience',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: 'test-jti',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      await expect(service.verifyAccessToken(mockToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle verification error', async () => {
      const mockToken = 'invalid-token';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyAccessToken(mockToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const mockToken = 'valid-refresh-token';
      const mockPayload = {
        uid: '1',
        username: 'testuser',
        domain: 'test',
        type: 'refresh',
        iss: 'test-issuer',
        aud: 'test-audience',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
        jti: 'test-jti',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      const result = await service.verifyRefreshToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: mockJwtConfig.refreshTokenSecret,
      });
    });

    it('should reject invalid token type', async () => {
      const mockToken = 'invalid-token';
      const mockPayload = {
        uid: '1',
        username: 'testuser',
        domain: 'test',
        type: 'access', // Wrong type
        iss: 'test-issuer',
        aud: 'test-audience',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
        jti: 'test-jti',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      await expect(service.verifyRefreshToken(mockToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockPayload = {
        uid: '1',
        username: 'testuser',
        domain: 'test',
        type: 'refresh',
        roles: ['user'],
        permissions: ['read'],
        email: 'test@example.com',
        iss: 'test-issuer',
        aud: 'test-audience',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
        jti: 'test-jti',
      };

      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';

      jest.spyOn(service, 'verifyRefreshToken').mockResolvedValue(mockPayload);
      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce(mockNewAccessToken)
        .mockReturnValueOnce(mockNewRefreshToken);

      const result = await service.refreshToken(mockRefreshToken);

      expect(result.accessToken).toBe(mockNewAccessToken);
      expect(result.refreshToken).toBe(mockNewRefreshToken);
      expect(result.tokenType).toBe('Bearer');
    });

    it('should handle refresh token verification failure', async () => {
      const mockRefreshToken = 'invalid-refresh-token';

      jest.spyOn(service, 'verifyRefreshToken').mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(service.refreshToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      const mockToken = 'token-to-revoke';
      const mockPayload = {
        uid: '1',
        username: 'testuser',
        jti: 'test-jti',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(mockPayload);

      await expect(service.revokeToken(mockToken)).resolves.not.toThrow();
      expect(jwtService.decode).toHaveBeenCalledWith(mockToken);
    });

    it('should handle revoke token error gracefully', async () => {
      const mockToken = 'invalid-token';

      jest.spyOn(jwtService, 'decode').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.revokeToken(mockToken)).resolves.not.toThrow();
    });
  });

  describe('parseExpiresIn', () => {
    it('should parse time units correctly', () => {
      // 使用反射访问私有方法进行测试
      const parseExpiresIn = (service as any).parseExpiresIn.bind(service);

      expect(parseExpiresIn('30s')).toBe(30);
      expect(parseExpiresIn('5m')).toBe(300);
      expect(parseExpiresIn('2h')).toBe(7200);
      expect(parseExpiresIn('1d')).toBe(86400);
    });

    it('should throw error for invalid format', () => {
      const parseExpiresIn = (service as any).parseExpiresIn.bind(service);

      expect(() => parseExpiresIn('invalid')).toThrow('Invalid expiresIn format');
      expect(() => parseExpiresIn('30x')).toThrow('Invalid time unit');
    });
  });
});
