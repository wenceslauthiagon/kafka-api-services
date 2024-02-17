import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig, getMoment } from '@zro/common';
import { AccessToken, JdpiAuthClient } from '@zro/api-jdpi/domain';

interface JwtTokenResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * Build access token from an authenticated client.
 */
@Injectable()
export class AccessTokenProvider {
  // ExpirationTime in miliseconds
  private readonly expirationTime: number;

  /**
   * Default constructor.
   * @param jwtService JWT sign service.
   * @param configService Config service.
   */
  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService<JwtConfig>,
  ) {
    this.expirationTime = configService.get<number>('APP_JWT_EXPIRES_IN');
  }

  /**
   * Generate an access token to auth client.
   * @param client Authenticated client.
   * @returns JWT access token.
   */
  async generateAccessToken(client: JdpiAuthClient): Promise<JwtTokenResponse> {
    const payload: AccessToken = {
      id: client.id,
      scope: client.scope,
    };

    const expiresIn = getMoment().add(this.expirationTime, 'ms').unix();

    // Sign access token.
    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn,
    };
  }
}
