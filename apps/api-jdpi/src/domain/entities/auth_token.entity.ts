/**
 * User authentication token.
 */
export interface AuthToken {
  /**
   * Signed access token.
   */
  accessToken: string;
}

/**
 * Access token payload.
 */
export interface AccessToken {
  /**
   * ClientId.
   */
  id: string;

  /**
   * Scope
   */
  scope: string;
}
