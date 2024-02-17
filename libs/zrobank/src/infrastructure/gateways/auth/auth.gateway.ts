import axios from 'axios';
import { Logger } from 'winston';
import { ZroBankAuthException } from '@zro/zrobank/infrastructure';

let accessToken: string;
let expires: number;
let pendingAccessTokenRequest: Promise<void>;

export interface ZroBankAuthGatewayConfig {
  appEnv: string;
  baseUrl: string;
  apiId: string;
  apiKey: string;
}

export class ZroBankAuthGateway {
  private static config: ZroBankAuthGatewayConfig;

  /**
   * Get Environment variables from configService
   */
  static build(config: ZroBankAuthGatewayConfig): void {
    this.config = config;
  }

  /**
   * Get apiKey
   * @return {String} apiKey.
   */
  static getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Get apiId
   * @return {String} apiId.
   */
  static getApiId(): string {
    return this.config.apiId;
  }

  /**
   * Get baseUrl
   * @return {String} BaseUrl.
   */
  static getBaseUrl(): string {
    return this.config.baseUrl;
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
    logger = logger.child({ context: ZroBankAuthGateway.name });

    if (!expires || expires <= Date.now()) {
      // Check if there is another getAccessToken running. If no, requests a new access token.
      if (!pendingAccessTokenRequest) {
        logger.debug('Get Access Token: Expires is null or expired.');
        pendingAccessTokenRequest = ZroBankAuthGateway.updateTokens(logger);
      }

      // Awaits for ZroBank reponse.
      await pendingAccessTokenRequest;

      // Free pending request.
      pendingAccessTokenRequest = null;
    }

    if (!accessToken) {
      throw new ZroBankAuthException();
    }

    logger.debug('Got authorization code.');

    return accessToken;
  }

  /**
   * Get access token.
   */
  static async updateAccessToken(logger: Logger): Promise<void> {
    try {
      const { data } = await axios.post(`${this.config.baseUrl}/auth/signin`, {
        api_id: this.getApiId(),
        api_key: this.getApiKey(),
      });

      logger.debug('Authentication sucessfuly.');

      accessToken = data.data?.access_token;
      let expiresIn = 3600; //in seconds, equals to 60minutes

      expiresIn *= 1000; // Convert to milisseconds

      if (expiresIn < 0) {
        expiresIn = 0;
      }

      expires = Date.now() + expiresIn;

      logger.debug(`Token expires in ${expiresIn}ms.`, { expiresIn });
    } catch (error) {
      ZroBankAuthGateway.clearTokens();
      ZroBankAuthGateway.restartUpdateTokens(logger);

      logger.error('Authentication failed.', { error });
    }
  }

  /**
   * Forget tokens.
   */
  static clearTokens(): void {
    accessToken = null;
    expires = null;
  }

  /**
   * Get new tokens.
   */
  static async updateTokens(logger: Logger): Promise<void> {
    try {
      await ZroBankAuthGateway.updateAccessToken(logger);
    } catch (error) {
      logger.error('FATAL ERROR: ZroBank authentication failed. Retry...', {
        stack: error.stack,
      });
      ZroBankAuthGateway.clearTokens();
      ZroBankAuthGateway.restartUpdateTokens(logger);
    }
  }

  /**
   * Restart update tokens as soon as possible.
   */
  static async restartUpdateTokens(logger: Logger): Promise<void> {
    setTimeout(async () => {
      await ZroBankAuthGateway.updateTokens(logger);
    }, 5000);
  }
}
