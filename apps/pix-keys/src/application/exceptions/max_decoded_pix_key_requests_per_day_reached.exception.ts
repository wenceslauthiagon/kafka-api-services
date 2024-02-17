import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { DecodedPixKey } from '@zro/pix-keys/domain';

@Exception(ExceptionTypes.USER, 'MAX_DECODED_PIX_KEY_REQUESTS_PER_DAY_REACHED')
export class MaxDecodePixKeyRequestsPerDayReachedException extends DefaultException {
  constructor(maxPerDay: number, pixDecodedPixKey: Partial<DecodedPixKey>) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_DECODED_PIX_KEY_REQUESTS_PER_DAY_REACHED',
      data: { maxPerDay, pixDecodedPixKey },
    });
  }
}
