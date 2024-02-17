import {
  CreatePaymentRequest,
  CreatePaymentResponse,
} from '@zro/picpay/interface';
import {
  CreateRefundRequest,
  CreateRefundResponse,
} from '@zro/picpay/interface/controller/create_refund.controller';
import { GetPaymentStatusResponse } from '@zro/picpay/interface/controller/get_payment_status.controller';

export interface IPaymentsService {
  create(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  getPaymentNotification(
    referenceId: string,
  ): Promise<GetPaymentStatusResponse>;
  createRefund(request: CreateRefundRequest): Promise<CreateRefundResponse>;
}
