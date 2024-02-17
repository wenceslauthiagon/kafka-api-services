import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

interface ApiKeyConfig {
  APP_API_KEY: string;
}

/**
 * Implement the api key authentication strategy.
 * Get the api key from authentication header and verify.
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'api-key',
) {
  private apiTopazioApikeyConfig: string;
  /**
   * Default constructor. Verify the api key.
   *
   * @param configService Configuration data.
   */
  constructor(private readonly configService: ConfigService<ApiKeyConfig>) {
    super(
      { header: 'authorization', prefix: '' },
      false,
      (apikey: string, next: (err: Error, verified?: boolean) => void) =>
        this.validate(apikey, next),
    );
    this.apiTopazioApikeyConfig = this.configService.get<string>('APP_API_KEY');
  }

  /**
   * @param payload The api key.
   * @param next The next.
   */
  validate(payload: string, next: (err: Error, verified?: boolean) => void) {
    if (this.apiTopazioApikeyConfig !== payload) {
      next(new UnauthorizedException());
    }
    next(null, true);
  }
}
