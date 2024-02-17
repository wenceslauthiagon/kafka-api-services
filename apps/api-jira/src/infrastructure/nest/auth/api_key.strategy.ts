import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { UnauthorizedException } from '@zro/common';

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
  private apiJiraApikeyConfig: string;
  /**
   * Default constructor. Verify the api key.
   *
   * @param configService Configuration data.
   */
  constructor(private readonly configService: ConfigService<ApiKeyConfig>) {
    super(
      { header: 'X-API-KEY', prefix: '' },
      true,
      (apikey: string, done: any) => this.validate(apikey, done),
    );
    this.apiJiraApikeyConfig = this.configService.get<string>('APP_API_KEY');
  }

  /**
   * @param payload The api key.
   * @param done The next.
   */
  validate(payload: string, done: any) {
    if (this.apiJiraApikeyConfig === payload) {
      done(null, true);
    }
    done(new UnauthorizedException());
  }
}
