import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class JdpiAxiosService {
  create(config: AxiosRequestConfig = {}): AxiosInstance {
    // Set default config headers
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    const jdpiAxios = axios.create(config);

    // WARNING: Remove sensitive data!!!!
    jdpiAxios.interceptors.response.use(
      (response) => {
        delete response?.config?.headers?.Authorization;
        return response;
      },
      (error) => {
        delete error?.response?.config?.headers?.Authorization;
        return Promise.reject(error);
      },
    );
    return jdpiAxios;
  }
}
