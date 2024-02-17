import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from 'winston';
import { InjectLogger } from '@zro/common';
import { DockAuthService } from '@zro/dock/infrastructure';

@Injectable()
export class DockAxiosService {
  constructor(
    @InjectLogger() private logger: Logger,
    private dockAuthService: DockAuthService,
  ) {
    this.logger = this.logger.child({ context: DockAxiosService.name });
  }

  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    const dockAxios = axios.create(config);

    dockAxios.interceptors.request.use(
      async (config) => {
        // Add access token to request.
        const accessToken = await this.dockAuthService.getAccessToken(
          this.logger,
        );
        Object.assign(config.headers, { Authorization: accessToken });
        return config;
      },
      (error) => {
        // WARNING: Remove sensitive data from logger and exception!
        delete error?.response?.config?.headers?.Authorization;
        return Promise.reject(error);
      },
    );

    dockAxios.interceptors.response.use(
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
    return dockAxios;
  }
}
