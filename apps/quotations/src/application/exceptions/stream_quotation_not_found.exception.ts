import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { StreamQuotation } from '@zro/quotations/domain';

@Exception(ExceptionTypes.SYSTEM, 'STREAM_QUOTATION_NOT_FOUND')
export class StreamQuotationNotFoundException extends DefaultException {
  constructor(data: Partial<StreamQuotation>) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'STREAM_QUOTATION_NOT_FOUND',
      data,
    });
  }
}
