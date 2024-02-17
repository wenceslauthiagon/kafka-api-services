import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { MissingEnvVarException } from '@zro/common';
import { ConfigService } from '@nestjs/config';

export interface NuPayConfig {
  APP_NUPAY_HOST: string;
}

@Injectable()
export class NuPayAxiosService {
  private baseURL: string;

  constructor(private configService: ConfigService<NuPayConfig>) {
    this.baseURL = this.configService.get<string>('APP_NUPAY_HOST');

    if (!this.baseURL) {
      throw new MissingEnvVarException(['APP_NUPAY_HOST']);
    }
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    //Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.headers,
    };

    // Set default base URL
    config.baseURL ??= this.baseURL;

    const nuPayAxios = axios.create(config);

    return nuPayAxios;
  }
}
