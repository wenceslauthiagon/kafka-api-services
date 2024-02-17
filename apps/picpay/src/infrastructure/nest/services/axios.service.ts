import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { MissingEnvVarException } from '@zro/common';

interface PicPayConfig {
  APP_PICPAY_HOST: string;
  APP_PICPAY_TOKEN: string;
}

@Injectable()
export class PicPayAxiosService {
  private baseURL: string;
  private apiToken: string;

  constructor(configService: ConfigService<PicPayConfig>) {
    this.baseURL = configService.get<string>('APP_PICPAY_HOST');
    this.apiToken = configService.get<string>('APP_PICPAY_TOKEN');

    if (!this.baseURL || !this.apiToken) {
      throw new MissingEnvVarException([
        ...(!this.baseURL ? ['APP_PICPAY_HOST'] : []),
        ...(!this.apiToken ? ['APP_PICPAY_TOKEN'] : []),
      ]);
    }
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-picpay-token': this.apiToken,
      ...config.headers,
    };

    // Set default base URL
    config.baseURL ??= this.baseURL;

    const picpayAxios = axios.create(config);

    picpayAxios.interceptors.request.use(
      (config) => {
        config.headers['x-picpay-token'] = this.apiToken;

        return config;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers['x-picpay-token'];
        return Promise.reject(error);
      },
    );

    picpayAxios.interceptors.response.use(
      (response) => {
        delete response?.config?.headers['x-picpay-token'];
        return response;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers['x-picpay-token'];
        return Promise.reject(error);
      },
    );
    return picpayAxios;
  }
}
