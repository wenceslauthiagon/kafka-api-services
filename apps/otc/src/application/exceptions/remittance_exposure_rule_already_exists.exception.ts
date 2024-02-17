import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { RemittanceExposureRule } from '@zro/otc/domain';

@Exception(
  ExceptionTypes.USER,
  'REMITTANCE_EXPOSURE_RULE_ALREADY_EXISTS_EXCEPTION',
)
export class RemittanceExposureRuleAlreadyExistsException extends DefaultException {
  constructor(data: Partial<RemittanceExposureRule>) {
    super({
      type: ExceptionTypes.USER,
      code: 'REMITTANCE_EXPOSURE_RULE_ALREADY_EXISTS_EXCEPTION',
      data,
    });
  }
}
