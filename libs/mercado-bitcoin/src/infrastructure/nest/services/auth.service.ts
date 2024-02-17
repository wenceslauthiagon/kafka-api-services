import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';
import { InjectLogger } from '@zro/common';
import {
  MercadoBitcoinAuthException,
  MercadoBitcoinGatewayConfig,
  MERCADO_BITCOIN_SERVICES,
} from '@zro/mercado-bitcoin/infrastructure';

@Injectable()
export class MercadoBitcoinAuthService implements OnModuleInit {
  private static MERCADO_BITCOIN_TIMEOUT = 'mercado_bitcoin_auth_timeout';
  private apiTokenId: string;
  private apiTokenSecret: string;
  private mercadoAxios: AxiosInstance = null;
  private accessToken: string = null;
  private expires: number = null;
  private pendingAccessTokenRequest: Promise<void> = null;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly configService: ConfigService<MercadoBitcoinGatewayConfig>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.logger = this.logger.child({
      context: MercadoBitcoinAuthService.name,
    });
    this.apiTokenId = this.configService.get<string>(
      'APP_MERCADO_BITCOIN_API_TOKEN_ID',
    );
    this.apiTokenSecret = this.configService.get<string>(
      'APP_MERCADO_BITCOIN_API_TOKEN_SECRET',
    );
    const baseURL = this.configService.get<string>(
      'APP_MERCADO_BITCOIN_BASE_URL',
    );
    this.mercadoAxios = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async onModuleInit() {
    this.restartUpdateTokens(this.logger);
  }

  /**
   * Get most recently MercadoBitcoin access token.
   * @param logger Default logger
   * @returns Access token
   */
  async getAccessToken(logger?: Logger): Promise<string> {
    logger = logger ?? this.logger;

    if (!this.expires || this.expires <= Date.now()) {
      // Check if there is another getAccessToken running. If no, requests a new access token.
      if (!this.pendingAccessTokenRequest) {
        logger.debug('Get Access Token: Expires is null or expired.');
        this.pendingAccessTokenRequest = this.updateToken(logger);
      }

      await this.pendingAccessTokenRequest;
    }

    if (!this.accessToken) {
      throw new MercadoBitcoinAuthException();
    }

    logger.debug('Got autorization code.');

    return this.accessToken;
  }

  /**
   * Update access token
   * @param logger Default logger.
   */
  private async updateToken(logger: Logger) {
    try {
      const payload = {
        login: this.apiTokenId,
        password: this.apiTokenSecret,
      };

      const { data } = await this.mercadoAxios.post(
        MERCADO_BITCOIN_SERVICES.AUTHORIZE,
        payload,
      );

      logger.debug('Authentication successfully.');

      this.accessToken = data.access_token;
      let expiresIn = data.expiration;

      expiresIn -= 60; // Set to expire one minute before they said
      expiresIn *= 1000; // Convert to milisseconds

      if (expiresIn < 0) {
        expiresIn = 0;
      }

      this.expires = Date.now() + expiresIn;

      this.scheduleRefreshToken(expiresIn, logger);

      logger.debug(`Token expires in ${expiresIn}ms.`, { expiresIn });
    } catch (error) {
      this.clearToken();
      this.restartUpdateTokens(logger);

      const { status, statusText } = error.response;
      logger.error('Authentication failed.', { status, statusText });
    }
  }

  /**
   * Restart update tokens as soon as possible.
   */
  private restartUpdateTokens(logger: Logger) {
    // Restart ASAP.
    this.registerTimeout(logger, 0);
  }

  /**
   * Schedule refresh token process to happen in refreshIn milliseconds.
   *
   * @param refreshIn Time in milliseconds.
   */
  private async scheduleRefreshToken(
    refreshIn: number,
    logger: Logger,
  ): Promise<void> {
    if (this.configService.get<string>('APP_ENV') !== 'test') {
      this.registerTimeout(logger, refreshIn);
    }
  }

  private registerTimeout(logger: Logger, timeout = 0) {
    // If timeout is already scheduled
    if (
      this.schedulerRegistry.doesExist(
        'timeout',
        MercadoBitcoinAuthService.MERCADO_BITCOIN_TIMEOUT,
      )
    ) {
      // Then get and clear previous timeout
      this.schedulerRegistry.deleteTimeout(
        MercadoBitcoinAuthService.MERCADO_BITCOIN_TIMEOUT,
      );
    }

    // Set a new timeout
    const scheduled = setTimeout(async () => {
      await this.getAccessToken(logger);
    }, timeout);

    // Remember scheduled timeout
    this.schedulerRegistry.addTimeout(
      MercadoBitcoinAuthService.MERCADO_BITCOIN_TIMEOUT,
      scheduled,
    );
  }

  /**
   * Forget old token.
   */
  private clearToken() {
    this.expires = null;
    this.accessToken = null;
  }
}
