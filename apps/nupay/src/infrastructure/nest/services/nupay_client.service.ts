import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';
import {
  NuPayCancelPaymentResponse,
  NuPayCreatePaymentRequest,
  NuPayCreatePaymentResponse,
  NuPayCreateRefundRequest,
  NuPayCreateRefundResponse,
  NuPayGetRefundStatusResponse,
  NuPayPaymentStatusResponse,
} from '@zro/nupay/interface';
import { ConfigService } from '@nestjs/config';
import { MissingEnvVarException } from '@zro/common';
import { NuPayAxiosService } from './axios.service';

interface NuPayCreateConfig {
  APP_NUPAY_HOST: string;
  APP_NUPAY_AUTH_MERCHANT_KEY: string;
  APP_NUPAY_AUTH_MERCHANT_TOKEN: string;
}

@Injectable()
export class NuPayClientService {
  private nuPayHost: string;
  private nuPayMerchantKey: string;
  private nuPayMerchantToken: string;
  private axios: AxiosInstance;

  constructor(
    private readonly nupayAxiosService: NuPayAxiosService,
    private configService: ConfigService<NuPayCreateConfig>,
  ) {
    this.axios = this.nupayAxiosService.create();
    this.nuPayHost = this.configService.get<string>('APP_NUPAY_HOST');
    this.nuPayMerchantKey = this.configService.get<string>(
      'APP_NUPAY_AUTH_MERCHANT_KEY',
    );
    this.nuPayMerchantToken = this.configService.get<string>(
      'APP_NUPAY_AUTH_MERCHANT_TOKEN',
    );

    if (!this.nuPayHost || !this.nuPayMerchantKey || !this.nuPayMerchantToken) {
      throw new MissingEnvVarException([
        ...(!this.nuPayHost ? ['APP_NUPAY_HOST'] : []),
        ...(!this.nuPayMerchantKey ? ['APP_NUPAY_AUTH_MERCHANT_KEY'] : []),
        ...(!this.nuPayMerchantToken ? ['APP_NUPAY_AUTH_MERCHANT_TOKEN'] : []),
      ]);
    }
  }

  private buildAxiosConfig() {
    return {
      headers: {
        'X-Merchant-Key': this.nuPayMerchantKey,
        'X-Merchant-Token': this.nuPayMerchantToken,
      },
    } as AxiosRequestConfig;
  }

  async cancelPayment(
    pspReferenceId: string,
  ): Promise<NuPayCancelPaymentResponse> {
    const url = `${this.nuPayHost}/v1/checkouts/payments/${pspReferenceId}/cancel`;
    const axiosRequestConfig = this.buildAxiosConfig();

    try {
      const response = await this.axios.post(url, {}, axiosRequestConfig);
      return response.data as NuPayCancelPaymentResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async createPayment(
    request: NuPayCreatePaymentRequest,
  ): Promise<NuPayCreatePaymentResponse> {
    const url = `${this.nuPayHost}/v1/checkouts/payments`;
    const axiosRequestConfig = this.buildAxiosConfig();

    try {
      const response = await this.axios.post(url, request, axiosRequestConfig);
      return response.data as NuPayCreatePaymentResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async getPaymentStatus(
    pspReferenceId: string,
  ): Promise<NuPayPaymentStatusResponse> {
    const url = `${this.nuPayHost}/v1/checkouts/payments/${pspReferenceId}/status`;
    const axiosRequestConfig = this.buildAxiosConfig();

    try {
      const response = await this.axios.get(url, axiosRequestConfig);
      return response.data as NuPayPaymentStatusResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async createRefund(
    pspReferenceId: string,
    request: NuPayCreateRefundRequest,
  ): Promise<NuPayCreateRefundResponse> {
    const url = `${this.nuPayHost}/v1/checkouts/payments/${pspReferenceId}/refunds`;
    const axiosRequestConfig = this.buildAxiosConfig();

    try {
      const response = await this.axios.post(url, request, axiosRequestConfig);
      return response.data as NuPayCreateRefundResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async getRefundStatus(
    pspReferenceId: string,
    refundId: string,
  ): Promise<NuPayGetRefundStatusResponse> {
    const url = `${this.nuPayHost}/v1/checkouts/payments/${pspReferenceId}/refunds/${refundId}`;
    const axiosRequestConfig = this.buildAxiosConfig();

    try {
      const response = await this.axios.get(url, axiosRequestConfig);
      return response.data as NuPayGetRefundStatusResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  private handleAxiosError(error: any) {
    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage = error.response.data.message;

      throw new Error(`Erro ${statusCode}: ${errorMessage}`);
    } else {
      throw new Error('Erro na requisição');
    }
  }
}
