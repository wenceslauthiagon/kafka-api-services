import { Injectable } from '@nestjs/common';
import { IPaymentsService } from '@zro/picpay/application';
import { PicpayClientService } from './picpay_client.service';
import { CreatePaymentResponse } from '@zro/picpay/interface';
import {
  GetPaymentStatusResponse,
  CreateRefundRequest,
  CreateRefundResponse,
} from '@zro/picpay/interface';
import { CreatePayment } from '@zro/picpay/domain';

@Injectable()
export class PaymentsService implements IPaymentsService {
  constructor(private readonly clientService: PicpayClientService) {}

  async create(request: CreatePayment): Promise<CreatePaymentResponse> {
    return this.clientService.createPayment(request);
  }

  async getPaymentNotification(
    referenceId: string,
  ): Promise<GetPaymentStatusResponse> {
    return await this.clientService.getPaymentStatus(referenceId);
  }

  async createRefund(
    request: CreateRefundRequest,
  ): Promise<CreateRefundResponse> {
    return this.clientService.createRefund(request);
  }
}
