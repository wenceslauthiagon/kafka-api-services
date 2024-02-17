import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig } from '@zro/common';
import { AccessToken, AuthAdmin } from '@zro/api-admin/domain';

/**
 * Build access token from an authenticated admin.
 */
@Injectable()
export class AccessTokenProvider {
  /**
   * Default constructor.
   * @param jwtService JWT sign service.
   * @param configService Configuration data.
   */
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<JwtConfig>,
  ) {}

  /**
   * Generate an access token to auth admin.
   * @param admin Authenticated admin.
   * @returns {string} JWT access token.
   */
  generateAccessToken(admin: AuthAdmin): string {
    const version = this.configService.get<number>('APP_JWT_VERSION');

    const payload: AccessToken = {
      email: admin.email, // Old format for legacy systems.
      iat: 0, // Old format for legacy systems.
      version,
      id: admin.id,
    };

    // Sign access token.
    return this.jwtService.sign(payload);
  }
}
