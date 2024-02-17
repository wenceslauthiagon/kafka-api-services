import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { MissingEnvVarException } from '@zro/common';
import { B2C2GatewayConfig } from '@zro/b2c2/infrastructure';

@Injectable()
export class B2C2AxiosService {
  private readonly baseURL: string;
  private readonly token: string;

  constructor(configService: ConfigService<B2C2GatewayConfig>) {
    this.baseURL = configService.get<string>('APP_B2C2_BASE_URL');
    this.token = configService.get<string>('APP_B2C2_AUTH_TOKEN');

    if (!this.baseURL || !this.token) {
      throw new MissingEnvVarException([
        ...(!this.baseURL ? ['APP_B2C2_BASE_URL'] : []),
        ...(!this.token ? ['APP_B2C2_AUTH_TOKEN'] : []),
      ]);
    }
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default base URL
    config.baseURL ??= this.baseURL;

    const b2c2Axios = axios.create(config);

    b2c2Axios.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Token ${this.token}`;

        return config;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers?.Authorization;
        return Promise.reject(error);
      },
    );

    b2c2Axios.interceptors.response.use(
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
    return b2c2Axios;
  }
}
