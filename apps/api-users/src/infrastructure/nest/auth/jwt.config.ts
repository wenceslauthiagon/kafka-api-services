export interface JwtConfig {
  APP_JWT_TOKEN: string;
  APP_JWT_IGNORE_EXPIRATION: boolean;
  APP_JWT_EXPIRES_IN: number;
  APP_JWT_VERSION: number;
  APP_JWT_TOKEN_V2_EXTRA: string;
  APP_JWT_V2_EXTRA_PHONE_NUMBERS: string;
  APP_JWT_CACHE_TTL_S: number;
}
