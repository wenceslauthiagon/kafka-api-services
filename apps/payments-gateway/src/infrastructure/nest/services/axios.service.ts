import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { MissingEnvVarException } from '@zro/common';
import { PaymentsGatewayConfig } from '@zro/payments-gateway/infrastructure';

@Injectable()
export class PaymentsGatewayAxiosService {
  private readonly baseURL: string;
  private readonly apiToken: string;

  constructor(configService: ConfigService<PaymentsGatewayConfig>) {
    this.baseURL = configService.get<string>('APP_PAYMENTS_GATEWAY_BASE_URL');
    this.apiToken = configService.get<string>('APP_PAYMENTS_GATEWAY_API_TOKEN');

    if (!this.baseURL || !this.apiToken) {
      throw new MissingEnvVarException([
        ...(!this.baseURL ? ['APP_PAYMENTS_GATEWAY_BASE_URL'] : []),
        ...(!this.apiToken ? ['APP_PAYMENTS_GATEWAY_API_TOKEN'] : []),
      ]);
    }
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.headers,
    };

    // Set default base URL
    config.baseURL ??= this.baseURL;

    const paymentsGatewayAxios = axios.create(config);

    paymentsGatewayAxios.interceptors.request.use(
      (config) => {
        config.headers['API-TOKEN'] = this.apiToken;

        return config;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers['API-TOKEN'];
        delete error?.response?.config?.headers['WALLET-ID'];
        return Promise.reject(error);
      },
    );

    paymentsGatewayAxios.interceptors.response.use(
      (response) => {
        delete response?.config?.headers['API-TOKEN'];
        delete response?.config?.headers['WALLET-ID'];
        return response;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers['API-TOKEN'];
        delete error?.response?.config?.headers['WALLET-ID'];
        return Promise.reject(error);
      },
    );
    return paymentsGatewayAxios;
  }
}
