import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { DecodedPixAccount } from '@zro/pix-payments/domain';

@Exception(
  ExceptionTypes.USER,
  'MAX_DECODED_PIX_ACCOUNT_REQUESTS_PER_DAY_REACHED',
)
export class MaxDecodedPixAccountRequestsPerDayReached extends DefaultException {
  constructor(
    maxPerDay: number,
    decodedPixAccount: Partial<DecodedPixAccount>,
  ) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_DECODED_PIX_ACCOUNT_REQUESTS_PER_DAY_REACHED',
      data: { maxPerDay, decodedPixAccount },
    });
  }
}
