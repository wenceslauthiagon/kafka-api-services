import { RefundErrorTypeEnum } from 'apps/nupay/src/domain';

export class RefundError {
  type: RefundErrorTypeEnum;
  message: string;
  code?: string;
}
