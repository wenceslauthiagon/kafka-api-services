import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { RemittanceExposureRule } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'REMITTANCE_EXPOSURE_RULE_NOT_FOUND_EXCEPTION')
export class RemittanceExposureRuleNotFoundException extends DefaultException {
  constructor(data: Partial<RemittanceExposureRule>) {
    super({
      type: ExceptionTypes.USER,
      code: 'REMITTANCE_EXPOSURE_RULE_NOT_FOUND_EXCEPTION',
      data,
    });
  }
}
