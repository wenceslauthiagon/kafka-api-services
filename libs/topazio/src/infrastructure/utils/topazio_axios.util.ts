import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { TopazioGatewayConfig } from '../config/topazio.config';

@Injectable()
export class TopazioAxiosService {
  private readonly clientId: string;

  constructor(
    private readonly configService: ConfigService<TopazioGatewayConfig>,
  ) {
    this.clientId = this.configService.get<string>(
      'APP_TOPAZIO_AUTH_CLIENT_ID',
    );
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      client_id: this.clientId,
      ...config.headers,
    };

    const topazioAxios = axios.create(config);

    // WARNING: Remove sensitive data!!!!
    topazioAxios.interceptors.response.use(
      (response) => {
        delete response?.config?.headers?.access_token;
        delete response?.config?.headers?.client_id;

        return response;
      },
      (error) => {
        delete error?.response?.config?.headers?.access_token;
        delete error?.response?.config?.headers?.client_id;

        return Promise.reject(error);
      },
    );
    return topazioAxios;
  }
}
