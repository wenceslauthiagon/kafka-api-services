import { Injectable } from '@nestjs/common';
import {
  NuPayCreateRefundRequest,
  NuPayCreateRefundResponse,
  NuPayGetRefundStatusResponse,
} from '@zro/nupay/interface';
import { IRefundService } from '@zro/nupay/application';

import { NuPayClientService } from './nupay_client.service';

@Injectable()
export class RefundService implements IRefundService {
  constructor(private readonly clientService: NuPayClientService) {}

  async create(
    pspReferenceId: string,
    request: NuPayCreateRefundRequest,
  ): Promise<NuPayCreateRefundResponse> {
    return this.clientService.createRefund(pspReferenceId, request);
  }

  async getStatus(
    pspReferenceId: string,
    refundId: string,
  ): Promise<NuPayGetRefundStatusResponse> {
    return await this.clientService.getRefundStatus(pspReferenceId, refundId);
  }
}
