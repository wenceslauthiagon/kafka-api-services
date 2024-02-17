import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { MissingEnvVarException } from '@zro/common';
import { ConfigService } from '@nestjs/config';

export interface CieloConfig {
  APP_CIELO_MERCHANT_ID: string;
  APP_CIELO_MERCHANT_KEY: string;
  APP_CIELO_API_URL: string;
  APP_CIELO_API_INFO_URL: string;
}

@Injectable()
export class CieloAxiosService {
  private apiUrl: string;
  private merchantId: string;
  private merchantKey: string;
  private apiUrlInformation: string;
  private useUrlInformation: boolean = false;

  constructor(private configService: ConfigService<CieloConfig>) {
    this.apiUrl = this.configService.get<string>('APP_CIELO_API_URL');
    this.merchantId = this.configService.get<string>('APP_CIELO_MERCHANT_ID');
    this.merchantKey = this.configService.get<string>('APP_CIELO_MERCHANT_KEY');
    this.apiUrlInformation = this.configService.get<string>(
      'APP_CIELO_API_INFO_URL',
    );

    if (
      !this.apiUrl ||
      !this.merchantId ||
      !this.merchantKey ||
      !this.apiUrlInformation
    ) {
      throw new MissingEnvVarException([
        ...(!this.apiUrl ? ['APP_CIELO_API_URL'] : []),
        ...(!this.merchantId ? ['APP_CIELO_MERCHANT_ID'] : []),
        ...(!this.merchantKey ? ['APP_CIELO_MERCHANT_KEY'] : []),
        ...(!this.apiUrlInformation ? ['APP_CIELO_API_INFO'] : []),
      ]);
    }
  }

  create(
    config: AxiosRequestConfig = {},
    useInfo: boolean = false,
  ): AxiosInstance {
    //Set default endpoint config
    this.useUrlInformation = useInfo;

    //Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      MerchantId: this.merchantId,
      MerchantKey: this.merchantKey,
      ...config.headers,
    };

    // Set default base URL
    config.baseURL ??= this.useUrlInformation
      ? this.apiUrlInformation
      : this.apiUrl;

    const cieloAxios = axios.create(config);

    cieloAxios.interceptors.request.use(
      (config) => {
        config.headers['MerchantId'] = this.merchantId;
        config.headers['MerchantKey'] = this.merchantKey;

        return config;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers['MerchantId'];
        delete error?.response?.config?.headers['MerchantKey'];
        return Promise.reject(error);
      },
    );

    cieloAxios.interceptors.response.use(
      (response) => {
        delete response?.config?.headers['MerchantId'];
        delete response?.config?.headers['MerchantKey'];
        return response;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers['MerchantId'];
        delete error?.response?.config?.headers['MerchantKey'];
        return Promise.reject(error);
      },
    );
    return cieloAxios;
  }
}
