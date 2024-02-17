import { Logger } from 'winston';
import { JWT } from 'google-auth-library';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { InjectLogger } from '@zro/common';
import { FcmGateway, FcmGatewayConfig, FCM_API } from '@zro/fcm/infrastructure';

@Injectable()
export class FcmService {
  private readonly baseUrl: string;
  private readonly privateKey: string;
  private readonly clientEmail: string;
  private fcm: AxiosInstance;
  private jwtClient: JWT;

  constructor(
    @InjectLogger() private readonly logger: Logger,
    configService: ConfigService<FcmGatewayConfig>,
  ) {
    this.logger = logger.child({ context: FcmService.name });
    this.baseUrl = configService.get('APP_CLOUD_MESSAGE_BASE_URL');
    this.clientEmail = configService.get('APP_CLOUD_MESSAGE_CLIENT_EMAIL');
    this.privateKey = configService
      .get('APP_CLOUD_MESSAGE_PRIVATE_KEY')
      .replace(/\\n/gm, '\n');
  }

  private async getAccessToken(): Promise<string> {
    if (!this.jwtClient) {
      this.jwtClient = new JWT(
        this.clientEmail,
        undefined,
        this.privateKey,
        FCM_API.SCOPES,
        undefined,
      );

      await this.jwtClient.authorize();
    }

    const { token } = await this.jwtClient.getAccessToken();

    this.logger.debug('Got autorization code.');

    return token;
  }

  private async instanceAxios(): Promise<void> {
    const jwtToken = await this.getAccessToken();

    this.fcm = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
    });
  }

  async getFcmGateway(logger?: Logger): Promise<FcmGateway> {
    await this.instanceAxios();
    return new FcmGateway(logger ?? this.logger, this.fcm);
  }
}
