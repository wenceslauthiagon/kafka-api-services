import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AsaasGatewayConfig } from '../config/asaas.config';

@Injectable()
export class AsaasAxiosService {
  private readonly apiToken: string;

  constructor(
    private readonly configService: ConfigService<AsaasGatewayConfig>,
  ) {
    this.apiToken = this.configService.get<string>('APP_ASAAS_API_TOKEN');
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      access_token: this.apiToken,
      ...config.headers,
    };

    const asaasAxios = axios.create(config);

    // WARNING: Remove sensitive data!!!!
    asaasAxios.interceptors.response.use(
      (response) => {
        delete response?.config?.headers?.access_token;
        return response;
      },
      (error) => {
        delete error?.response?.config?.headers?.access_token;

        return Promise.reject(error);
      },
    );
    return asaasAxios;
  }
}
