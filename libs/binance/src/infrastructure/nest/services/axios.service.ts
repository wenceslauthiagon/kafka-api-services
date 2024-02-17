import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ConfigService } from '@nestjs/config';
import { MissingEnvVarException } from '@zro/common';
import { BinanceGatewayConfig } from '@zro/binance/infrastructure';

@Injectable()
export class BinanceAxiosService {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(configService: ConfigService<BinanceGatewayConfig>) {
    this.baseURL = configService.get<string>('APP_BINANCE_BASE_URL');
    this.apiKey = configService.get<string>('APP_BINANCE_API_KEY');
    this.apiSecret = configService.get<string>('APP_BINANCE_API_SECRET');

    if (!this.baseURL || !this.apiKey || !this.apiSecret) {
      throw new MissingEnvVarException([
        ...(!this.baseURL ? ['APP_BINANCE_BASE_URL'] : []),
        ...(!this.apiKey ? ['APP_BINANCE_API_KEY'] : []),
        ...(!this.apiSecret ? ['APP_BINANCE_API_SECRET'] : []),
      ]);
    }
  }

  // Create public Axios instance
  createPublic(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      'User-Agent': `Bot-Zrobank/1.0`,
    };

    // Set default base URL
    config.baseURL = this.baseURL;

    const binanceAxios = axios.create(config);

    return binanceAxios;
  }

  // Create private Axios instance
  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      'X-MBX-APIKEY': this.apiKey,
      'User-Agent': `Bot-Zrobank/1.0`,
    };

    // Set default base URL
    config.baseURL = this.baseURL;

    const binanceAxios = axios.create(config);

    binanceAxios.interceptors.request.use(
      (config) => {
        // Set signature and update config.url
        const timestamp = Date.now();

        const url = config.url.split('?');

        if (url.length > 1) {
          const endpoint = url[0];
          const newParams = `${url[1]}&timestamp=${timestamp}`;

          const signature = crypto
            .createHmac('sha256', this.apiSecret)
            .update(newParams)
            .digest('hex');

          config.url = `${endpoint}?${newParams}&signature=${signature}`;
        }

        return config;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        error?.response?.config?.url['signature'] &&
          delete error?.response?.config?.url['signature'];
        error?.response?.config?.headers['X-MBX-APIKEY'] &&
          delete error?.response?.config?.headers['X-MBX-APIKEY'];
        return Promise.reject(error);
      },
    );

    binanceAxios.interceptors.response.use(
      (response) => {
        // WARNING: Remove sensitive data from logger and exception!
        response?.config?.url['signature'] &&
          delete response?.config?.url['signature'];
        response?.config?.headers['X-MBX-APIKEY'] &&
          delete response?.config?.headers['X-MBX-APIKEY'];
        return response;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        error?.response?.config?.url['signature'] &&
          delete error?.response?.config?.url['signature'];
        error?.response?.config?.headers['X-MBX-APIKEY'] &&
          delete error?.response?.config?.headers['X-MBX-APIKEY'];
        return Promise.reject(error);
      },
    );

    return binanceAxios;
  }
}
