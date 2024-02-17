import { v4 as uuidV4 } from 'uuid';
import { Milliseconds } from 'cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig, RedisService, getMoment } from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AccessToken, RefreshTokenCache } from '@zro/api-users/domain';

/**
 * Build access token from an authenticated user.
 */
@Injectable()
export class AccessTokenProvider {
  private readonly ttl: Milliseconds;

  /**
   * Default constructor.
   * @param jwtService JWT sign service.
   * @param configService Configuration data.
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<JwtConfig>,
    private readonly redisService: RedisService,
  ) {
    // Default is 30 days
    this.ttl = this.configService.get<number>(
      'APP_REFRESH_TOKEN_TTL',
      2592000000,
    );
  }

  /**
   * Generate an access token to auth user.
   * @param user Authenticated user.
   * @returns JWT access token.
   */
  async generateAccessToken(user: AuthUser): Promise<string> {
    const version = this.configService.get<number>('APP_JWT_VERSION');

    // Always delete refreshToken and generate new one
    await this.redisService.delete(`refresh-token-users-${user.uuid}`);

    const refreshTokenCache: RefreshTokenCache = {
      user: {
        uuid: user.uuid,
        phoneNumber: user.phoneNumber,
      },
      refreshToken: {
        uuid: uuidV4(),
        eat: getMoment().add(this.ttl, 'ms').toDate(),
      },
    };

    await this.redisService.set({
      key: `refresh-token-users-${user.uuid}`,
      data: refreshTokenCache,
      ttl: this.ttl,
    });

    const payload: AccessToken = {
      phone_number: user.phoneNumber, // Old format for legacy systems.
      iat: 0, // Old format for legacy systems.
      version,
      id: user.uuid,
      refresh_token: refreshTokenCache.refreshToken,
      disabled_services: null,
    };

    // Sign access token.
    return this.jwtService.sign(payload);
  }
}
