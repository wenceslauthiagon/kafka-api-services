import axios from 'axios';
import { Logger } from 'winston';
import { GenialAuthException } from '@zro/genial/infrastructure';

let accessToken: string;
let expires: number;
let pendingAccessTokenRequest: Promise<void>;

export interface GenialAuthGatewayConfig {
  appEnv: string;
  baseUrl: string;
  basicAuthorization: string;
}

export class GenialAuthGateway {
  private static config: GenialAuthGatewayConfig;

  /**
   * Get Environment variables from configService
   */
  static build(config: GenialAuthGatewayConfig): void {
    this.config = config;
  }

  /**
   * Get basicAuthorization
   * @return {String} basicAuthorization.
   */
  static getBasicAuthorization(): string {
    return this.config.basicAuthorization;
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
    logger = logger.child({ context: GenialAuthGateway.name });

    if (!expires || expires <= Date.now()) {
      // Check if there is another getAccessToken running. If no, requests a new access token.
      if (!pendingAccessTokenRequest) {
        logger.debug('Get Access Token: Expires is null or expired.');
        pendingAccessTokenRequest = GenialAuthGateway.updateTokens(logger);
      }

      // Awaits for Genial reponse.
      await pendingAccessTokenRequest;

      // Free pending request.
      pendingAccessTokenRequest = null;
    }

    if (!accessToken) {
      throw new GenialAuthException();
    }

    logger.debug('Got authorization code.');

    return accessToken;
  }

  /**
   * Get access token.
   */
  static async updateAccessToken(logger: Logger): Promise<void> {
    try {
      const { data } = await axios.post(
        `${this.config.baseUrl}/authentication?=`,
        {
          headers: {
            'Basic-Authorization': this.config.basicAuthorization,
          },
        },
      );

      logger.debug('Authentication sucessfuly.');

      accessToken = data.token;
      let expiresIn = 900; //in seconds, equals to 15minutes

      expiresIn *= 1000; // Convert to milisseconds

      if (expiresIn < 0) {
        expiresIn = 0;
      }

      expires = Date.now() + expiresIn;

      logger.debug(`Token expires in ${expiresIn}ms.`, { expiresIn });
    } catch (error) {
      GenialAuthGateway.clearTokens();
      GenialAuthGateway.restartUpdateTokens(logger);

      logger.error('Authentication Genial failed.', { error });
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
      await GenialAuthGateway.updateAccessToken(logger);
    } catch (error) {
      logger.error('FATAL ERROR: Genial authentication failed. Retry...', {
        stack: error.stack,
      });
      GenialAuthGateway.clearTokens();
      GenialAuthGateway.restartUpdateTokens(logger);
    }
  }

  /**
   * Restart update tokens as soon as possible.
   */
  static async restartUpdateTokens(logger: Logger): Promise<void> {
    setTimeout(async () => {
      await GenialAuthGateway.updateTokens(logger);
    }, 5000);
  }
}
