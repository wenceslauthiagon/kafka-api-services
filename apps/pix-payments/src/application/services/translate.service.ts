import { Payment } from '@zro/pix-payments/domain';

export interface TranslateService {
  translatePixPaymentFailed(failedCode?: string): Promise<Payment['failed']>;
}
