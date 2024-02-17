import { AuthUser } from '@zro/users/domain';

enum MethodHTTP {
  POST = 'POST',
  GET = 'GET',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * Refresh token information cached.
 */
export interface RefreshTokenCache {
  user: Partial<AuthUser>;
  refreshToken: RefreshToken;
}

/**
 * User authentication token.
 */
export interface AuthToken {
  /**
   * Signed access token.
   */
  accessToken: string;
}

interface DisabledService {
  method: MethodHTTP;
  endpoint: string;
}

export interface RefreshToken {
  uuid: string;
  eat: Date;
}

/**
 * Access token payload.
 */
export interface AccessToken {
  /**
   * User uuid.
   */
  id: string;

  /**
   * User phone number.
   * Old format for legacy API.
   */
  phone_number: string;

  /**
   * Refresh token.
   * For new version API.
   */
  refresh_token: RefreshToken;

  /**
   * Disabled services.
   * For new version API.
   */
  disabled_services: DisabledService[];
}
