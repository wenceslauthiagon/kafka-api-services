import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from 'winston';
import { InjectLogger } from '@zro/common';

@Injectable()
export class MercadoBitcoinAxiosPublicService {
  constructor(@InjectLogger() private logger: Logger) {
    this.logger = this.logger.child({
      context: MercadoBitcoinAxiosPublicService.name,
    });
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    const mercadoBitcoinAxios = axios.create(config);

    return mercadoBitcoinAxios;
  }
}
