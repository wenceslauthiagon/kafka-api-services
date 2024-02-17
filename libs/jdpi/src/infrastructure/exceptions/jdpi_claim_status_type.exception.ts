import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_CLAIM_STATUS_TYPE')
export class JdpiClaimStatusTypeException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Claim Status Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_CLAIM_STATUS_TYPE',
      data,
    });
  }
}
