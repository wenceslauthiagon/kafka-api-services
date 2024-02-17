import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';
import { DockAuthException, DockGatewayConfig } from '@zro/dock/infrastructure';
import { InjectLogger } from '@zro/common';

@Injectable()
export class DockAuthService implements OnModuleInit {
  private static DOCK_AUTH_TIMEOUT = 'dock_auth_timeout';
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private dockAxios: AxiosInstance = null;
  private accessToken: string = null;
  private expires: number = null;
  private pendingAccessTokenRequest: Promise<void> = null;

  constructor(
    @InjectLogger() private logger: Logger,
    private readonly configService: ConfigService<DockGatewayConfig>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.logger = this.logger.child({ context: DockAuthService.name });
    this.clientId = this.configService.get<string>('APP_DOCK_AUTH_CLIENT_ID');
    this.clientSecret = this.configService.get<string>(
      'APP_DOCK_AUTH_CLIENT_SECRET',
    );
    this.baseUrl = this.configService.get<string>('APP_DOCK_AUTH_BASE_URL');
    this.dockAxios = axios.create({
      baseURL: this.baseUrl,
    });
  }

  async onModuleInit() {
    this.restartUpdateTokens(this.logger);
  }

  /**
   * Get most recently Dock access token.
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
      throw new DockAuthException();
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
      const payload = new URLSearchParams();
      payload.append('client_id', this.clientId);
      payload.append('client_secret', this.clientSecret);

      const { data } = await this.dockAxios.post(
        `/oauth2/token?grant_type=client_credentials`,
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      logger.debug('Authentication successfully.');

      this.accessToken = data.access_token;
      let expiresIn = data.expires_in;

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

      if (error && error.response) {
        const { status, statusText } = error.response;
        logger.error('Authentication failed.', { status, statusText });
      } else {
        logger.error('Unknown authentication error.', { error });
      }
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
        DockAuthService.DOCK_AUTH_TIMEOUT,
      )
    ) {
      // Then get and clear previous timeout
      this.schedulerRegistry.deleteTimeout(DockAuthService.DOCK_AUTH_TIMEOUT);
    }

    // Set a new timeout
    const scheduled = setTimeout(async () => {
      await this.getAccessToken(logger);
    }, timeout);

    // Remember scheduled timeout
    this.schedulerRegistry.addTimeout(
      DockAuthService.DOCK_AUTH_TIMEOUT,
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
