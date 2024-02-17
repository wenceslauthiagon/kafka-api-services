import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'JDPI_CLAIM_TYPE')
export class JdpiClaimTypeException extends DefaultException {
  constructor(data?: number) {
    super({
      message: 'Jdpi Claim Type error',
      type: ExceptionTypes.SYSTEM,
      code: 'JDPI_CLAIM_TYPE',
      data,
    });
  }
}
