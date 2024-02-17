import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from 'winston';
import { InjectLogger } from '@zro/common';
import { MercadoBitcoinAuthService } from '@zro/mercado-bitcoin/infrastructure';

@Injectable()
export class MercadoBitcoinAxiosService {
  constructor(
    @InjectLogger() private logger: Logger,
    private authService: MercadoBitcoinAuthService,
  ) {
    this.logger = this.logger.child({
      context: MercadoBitcoinAxiosService.name,
    });
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    const mercadoBitcoinAxios = axios.create(config);

    mercadoBitcoinAxios.interceptors.request.use(
      async (config) => {
        // Add access token to request.
        const accessToken = await this.authService.getAccessToken(this.logger);
        Object.assign(config.headers, { Authorization: accessToken });
        return config;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers?.Authorization;
        return Promise.reject(error);
      },
    );

    mercadoBitcoinAxios.interceptors.response.use(
      (response) => {
        delete response?.config?.headers?.Authorization;
        return response;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers?.Authorization;
        return Promise.reject(error);
      },
    );
    return mercadoBitcoinAxios;
  }
}
