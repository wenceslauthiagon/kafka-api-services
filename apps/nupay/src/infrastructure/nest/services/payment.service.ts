import { Injectable } from '@nestjs/common';
import {
  NuPayCancelPaymentResponse,
  NuPayCreatePaymentRequest,
  NuPayCreatePaymentResponse,
  NuPayPaymentStatusResponse,
} from '@zro/nupay/interface';
import { IPaymentService } from '@zro/nupay/application';

import { NuPayClientService } from './nupay_client.service';

@Injectable()
export class PaymentService implements IPaymentService {
  constructor(private readonly clientService: NuPayClientService) {}

  async create(
    request: NuPayCreatePaymentRequest,
  ): Promise<NuPayCreatePaymentResponse> {
    return this.clientService.createPayment(request);
  }

  async getStatus(referenceId: string): Promise<NuPayPaymentStatusResponse> {
    return await this.clientService.getPaymentStatus(referenceId);
  }

  async cancel(pspReferenceId: string): Promise<NuPayCancelPaymentResponse> {
    return this.clientService.cancelPayment(pspReferenceId);
  }
}
