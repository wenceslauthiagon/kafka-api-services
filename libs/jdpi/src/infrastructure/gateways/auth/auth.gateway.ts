import axios from 'axios';
import { Logger } from 'winston';
import { isInt } from 'class-validator';
import { JdpiAuthException } from '@zro/jdpi/infrastructure';

let accessToken: string;
let expirationDate: number;
let pendingAccessTokenRequest: Promise<void>;
const ONE_MINUTE = 60;
const MILISECONDS = 1000;

export interface JdpiAuthGatewayConfig {
  appEnv: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

interface JdpiAuthResponse {
  access_token: string;
  expires_in: number;
}

export class JdpiAuthGateway {
  private static config: JdpiAuthGatewayConfig;

  /**
   * Get Environment variables from configService
   */
  static build(config: JdpiAuthGatewayConfig): void {
    this.config = config;
  }

  /**
   * Get clientId
   * @return ClientId.
   */
  static getClientId(): string {
    return this.config.clientId;
  }

  /**
   * Get baseUrl
   * @return BaseUrl.
   */
  static getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Get expires time.
   * @return Expiration time.
   */
  static getExpires(): number {
    return expirationDate;
  }

  /**
   * Get access token.
   */
  static async getAccessToken(logger: Logger): Promise<string> {
    logger = logger.child({ context: JdpiAuthGateway.name });

    if (!expirationDate || expirationDate <= Date.now()) {
      // Check if there is another getAccessToken running. If no, requests a new access token.
      if (!pendingAccessTokenRequest) {
        logger.debug('Get Access Token: Expires is null or expired.');
        pendingAccessTokenRequest = JdpiAuthGateway.updateTokens(logger);
      }

      // Awaits for Jdpi reponse.
      await pendingAccessTokenRequest;

      // Free pending request.
      pendingAccessTokenRequest = null;
    }

    if (!accessToken) {
      throw new JdpiAuthException('Access Token failed');
    }

    logger.debug('Got access token.');

    return `Bearer ${accessToken}`;
  }

  /**
   * Get access and refresh tokens.
   */
  static async updateAccessAndRefreshTokens(logger: Logger): Promise<void> {
    try {
      const payload = new URLSearchParams();
      payload.append('client_id', this.config.clientId);
      payload.append('client_secret', this.config.clientSecret);
      payload.append('grant_type', 'client_credentials');
      payload.append('scope', 'dict_api,qrcode_api,spi_api');

      const { data } = await axios.post<JdpiAuthResponse>(
        `${this.config.baseUrl}/auth/jdpi/connect/token`,
        payload,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      logger.debug('Authentication successfully.');

      accessToken = data.access_token;
      let expiresIn = data.expires_in;

      expiresIn -= ONE_MINUTE; // Set to expire one minute before they said.
      expiresIn *= MILISECONDS; // Convert to milisseconds.
      expiresIn -= Date.now(); // Get difference between now.

      if (expiresIn < 0) {
        expiresIn = 0;
      }

      expirationDate = Date.now() + expiresIn;

      JdpiAuthGateway.scheduleRefreshToken(expiresIn, logger);

      logger.debug(`Token expires in ${expiresIn}ms.`, { expiresIn });
    } catch (error) {
      JdpiAuthGateway.clearTokens();
      JdpiAuthGateway.restartUpdateTokens(logger);

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
    accessToken = null;
    expirationDate = null;
  }

  /**
   * Get new tokens.
   */
  static async updateTokens(logger: Logger): Promise<void> {
    try {
      await JdpiAuthGateway.updateAccessAndRefreshTokens(logger);
    } catch (error) {
      logger.error('FATAL ERROR: JDPI authentication failed. Retry...', {
        stack: error.stack,
      });
      JdpiAuthGateway.clearTokens();
      JdpiAuthGateway.restartUpdateTokens(logger);
    }
  }

  /**
   * Restart update tokens as soon as possible.
   */
  static restartUpdateTokens(logger: Logger): void {
    setTimeout(() => JdpiAuthGateway.updateTokens(logger), 1000);
  }

  /**
   * Schedule refresh token process to happen in refreshIn milliseconds.
   *
   * @param refreshIn Time in milliseconds.
   */
  static scheduleRefreshToken(refreshIn: number, logger: Logger): void {
    if (this.config.appEnv !== 'test' && isInt(refreshIn)) {
      setTimeout(
        () => JdpiAuthGateway.updateAccessAndRefreshTokens(logger),
        refreshIn,
      );
    }
  }
}
