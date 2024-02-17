import axios from 'axios';
import { Logger } from 'winston';
import { TopazioAuthException } from '@zro/topazio/infrastructure';

let accessToken: string;
let refreshToken: string;
let expires: number;
let authorizationCode: string;
let pendingAccessTokenRequest: Promise<void>;

export interface TopazioAuthGatewayConfig {
  appEnv: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

export class TopazioAuthGateway {
  private static config: TopazioAuthGatewayConfig;

  /**
   * Get Environment variables from configService
   */
  static build(config: TopazioAuthGatewayConfig): void {
    this.config = config;
  }

  /**
   * Get clientId
   * @return {String} ClientId.
   */
  static getClientId(): string {
    return this.config.clientId;
  }

  /**
   * Get baseUrl
   * @return {String} BaseUrl.
   */
  static getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Get refreshToken
   * @return {String} Refresh token.
   */
  static getRefreshToken(): string {
    return refreshToken;
  }

  /**
   * Get expires time.
   * @return {Number} Expiration time.
   */
  static getExpires(): number {
    return expires;
  }

  /**
   * Get access token.
   */
  static async getAccessToken(logger: Logger): Promise<string> {
    logger = logger.child({ context: TopazioAuthGateway.name });

    if (!expires || expires <= Date.now()) {
      // Check if there is another getAccessToken running. If no, requests a new access token.
      if (!pendingAccessTokenRequest) {
        logger.debug('Get Access Token: Expires is null or expired.');
        pendingAccessTokenRequest = TopazioAuthGateway.updateTokens(logger);
      }

      // Awaits for Topazio reponse.
      await pendingAccessTokenRequest;

      // Free pending request.
      pendingAccessTokenRequest = null;
    }

    if (!accessToken) {
      throw new TopazioAuthException();
    }

    logger.debug('Got authorization code.');

    return accessToken;
  }

  /**
   * Update authorization code.
   */
  static async updateAuthorizationCode(logger: Logger): Promise<void> {
    try {
      const redirectUri = 'http://localhost';
      const responseParam = '/?code=';

      const { data } = await axios.post(
        `${this.config.baseUrl}/grant-code`,
        {
          client_id: this.config.clientId,
          redirect_uri: redirectUri,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );

      logger.debug('Got authorization code.');

      authorizationCode = data.redirect_uri.substring(
        redirectUri.length + responseParam.length,
      );
    } catch (error) {
      TopazioAuthGateway.clearTokens();
      TopazioAuthGateway.restartUpdateTokens(logger);

      // WARNING: Remove sensitive data.
      delete error?.response?.config?.body?.client_id;

      throw new TopazioAuthException(error);
    }
  }

  /**
   * Get access and refresh tokens.
   */
  static async updateAccessAndRefreshTokens(logger: Logger): Promise<void> {
    const BASE64_CREDENTIALS = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');

    try {
      const payload = new URLSearchParams();
      payload.append('code', authorizationCode);
      if (!expires || expires <= Date.now()) {
        payload.append('grant_type', 'authorization_code');
      } else {
        payload.append('grant_type', 'refresh_token');
        payload.append('refresh_token', refreshToken);
      }

      const { data } = await axios.post(
        `${this.config.baseUrl}/access-token`,
        payload,
        {
          headers: {
            Authorization: `Basic ${BASE64_CREDENTIALS}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      logger.debug('Authentication successfully.');

      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      let expiresIn = data.expires_in;

      expiresIn -= 60; // Set to expire one minute before they said
      expiresIn *= 1000; // Convert to milisseconds

      if (expiresIn < 0) {
        expiresIn = 0;
      }

      expires = Date.now() + expiresIn;

      TopazioAuthGateway.scheduleRefreshToken(expiresIn, logger);

      logger.debug(`Token expires in ${expiresIn}ms.`, { expiresIn });
    } catch (error) {
      TopazioAuthGateway.clearTokens();
      TopazioAuthGateway.restartUpdateTokens(logger);

      if (error?.response) {
        const { status, statusText } = error.response;
        logger.error('Authentication failed.', { status, statusText });
      }

      logger.error('Unexpected error to update token.', {
        error: error.isAxiosError ? error.message : error,
      });
    }
  }

  /**
   * Forget tokens.
   */
  static clearTokens(): void {
    authorizationCode = null;
    accessToken = null;
    refreshToken = null;
    expires = null;
  }

  /**
   * Get new tokens.
   */
  static async updateTokens(logger: Logger): Promise<void> {
    try {
      await TopazioAuthGateway.updateAuthorizationCode(logger);
      await TopazioAuthGateway.updateAccessAndRefreshTokens(logger);
    } catch (error) {
      logger.error('FATAL ERROR: Topazio authentication failed. Retry...', {
        stack: error.stack,
      });
      TopazioAuthGateway.clearTokens();
      TopazioAuthGateway.restartUpdateTokens(logger);
    }
  }

  /**
   * Restart update tokens as soon as possible.
   */
  static async restartUpdateTokens(logger: Logger): Promise<void> {
    setTimeout(async () => {
      await TopazioAuthGateway.updateTokens(logger);
    }, 0);
  }

  /**
   * Schedule refresh token process to happen in refreshIn milliseconds.
   *
   * @param {Integer} refreshIn Time in milliseconds.
   */
  static async scheduleRefreshToken(
    refreshIn: number,
    logger: Logger,
  ): Promise<void> {
    if (this.config.appEnv !== 'test') {
      setTimeout(async () => {
        TopazioAuthGateway.updateAccessAndRefreshTokens(logger);
      }, refreshIn);
    }
  }
}
