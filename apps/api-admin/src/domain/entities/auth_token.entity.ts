/**
 * Admin authentication token.
 */
export interface AuthToken {
  /**
   * Signed access token.
   */
  accessToken: string;
  // FIXME: Add refresh token
  // refreshToken: string;
}

/**
 * Access token payload.
 */
export interface AccessToken {
  /**
   * Admin's email.
   * Old format for legacy API.
   */
  email: string;

  /**
   * Expiration time.
   * Old format for legacy API.
   */
  iat: number;

  /**
   * Version number. Old tokens will be invalid.
   */
  version: number;

  /**
   * Admin id.
   * Old format for legacy database schema.
   */
  id: number;
}
