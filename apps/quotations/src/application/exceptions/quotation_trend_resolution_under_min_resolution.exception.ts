import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { QuotationTrendResolution } from '@zro/quotations/domain';

/**
 * Thrown when user tries to get a resolution under min resolution.
 */
@Exception(
  ExceptionTypes.USER,
  'QUOTATION_TREND_RESOLUTION_UNDER_MIN_RESOLUTION',
)
export class QuotationTrendResolutionUnderMinResolutionException extends DefaultException {
  constructor(resolution: QuotationTrendResolution) {
    super({
      type: ExceptionTypes.USER,
      code: 'QUOTATION_TREND_RESOLUTION_UNDER_MIN_RESOLUTION',
      data: { resolution },
    });
  }
}
