import { AxiosInstance } from 'axios';
import {
  CieloCancelTransactionResponse,
  CieloCaptureTransactionResponse,
  CieloCreateAuthenticatedDebitTransactionRequest,
  CieloCreateAuthenticatedDebitTransactionResponse,
  CieloCreateCreditTransactionRequest,
  CieloCreateCreditTransactionResponse,
  CieloCreateNonAuthenticatedDebitTransactionRequest,
  CieloCreateNonAuthenticatedDebitTransactionResponse,
} from '@zro/cielo/infrastructure';
import { Injectable } from '@nestjs/common';
import { CieloAxiosService } from './axios.service';

@Injectable()
export class CieloClientHttpService {
  private axios: AxiosInstance;

  constructor(private readonly cieloAxiosService: CieloAxiosService) {
    this.axios = this.cieloAxiosService.create();
  }

  async createCreditTransaction(
    request: CieloCreateCreditTransactionRequest,
  ): Promise<CieloCreateCreditTransactionResponse> {
    try {
      const response = await this.axios.post('/v2/sales', request);
      return response.data as CieloCreateCreditTransactionResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async getTransaction(
    paymentId: string,
  ): Promise<CieloCaptureTransactionResponse> {
    try {
      const response = await this.axios.get(`/v2/sales/${paymentId}`);
      return response.data as CieloCaptureTransactionResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async createAuthenticatedDebitTransaction(
    request: CieloCreateAuthenticatedDebitTransactionRequest,
  ): Promise<CieloCreateAuthenticatedDebitTransactionResponse> {
    try {
      const response = await this.axios.post('/v2/sales', request);

      await this.axios.put(`/v2/sales/${response.data.PaymentId}/capture`);

      const transactionResponse = await this.axios.get(
        `/v2/sales/${response.data.PaymentId}`,
      );

      return transactionResponse.data as CieloCreateAuthenticatedDebitTransactionResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async createNonAuthenticatedDebitTransaction(
    request: CieloCreateNonAuthenticatedDebitTransactionRequest,
  ): Promise<CieloCreateNonAuthenticatedDebitTransactionResponse> {
    try {
      const response = await this.axios.post(`/v2/sales`, request);
      return response.data as CieloCreateNonAuthenticatedDebitTransactionResponse;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  async cancelTransaction(
    paymentId: string,
    amount: number,
  ): Promise<CieloCancelTransactionResponse> {
    try {
      const response = await this.axios.put(
        `/v2/sales/${paymentId}/void?amount=${amount}`,
      );
      return response.data as CieloCancelTransactionResponse;
    } catch (error) {
      throw new Error('Request error');
    }
  }

  private handleAxiosError(error: any) {
    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage = error.response.data.message;

      throw new Error(`Error ${statusCode}: ${errorMessage}`);
    } else {
      throw new Error('Request error');
    }
  }
}
