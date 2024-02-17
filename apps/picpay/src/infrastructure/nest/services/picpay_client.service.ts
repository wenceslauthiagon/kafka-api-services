import { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreateRefundRequest,
  CreateRefundResponse,
} from '@zro/picpay/interface';
import { PicPayAxiosService } from './axios.service';

@Injectable()
export class PicpayClientService {
  private axios: AxiosInstance;

  constructor(private picpayAxiosService: PicPayAxiosService) {
    this.axios = this.picpayAxiosService.create();
  }

  async createPayment(
    request: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    const url = `/payments`;

    try {
      const response = await this.axios.post(url, request);
      return response.data as CreatePaymentResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async getPaymentStatus(referenceId: string) {
    const url = `/payments/${referenceId}/status`;

    try {
      const response = await this.axios.get(url);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async createRefund(
    request: CreateRefundRequest,
  ): Promise<CreateRefundResponse> {
    const url = `/payments/${request.referenceId}/refunds`;

    try {
      const response = await this.axios.post(url, request);
      return response.data as CreateRefundResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  private handleAxiosError(error: any) {
    if (error.response) {
      const statusCode = error.response.status;

      throw new Error(`Erro ${statusCode}: ${error.response.data}`);
    } else {
      throw new Error(error);
    }
  }
}
