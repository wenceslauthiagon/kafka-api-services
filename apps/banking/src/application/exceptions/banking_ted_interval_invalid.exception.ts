import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

/**
 * Thrown when user tries to create ted out of the permitted time.
 */
@Exception(ExceptionTypes.USER, 'BANKING_TED_INTERVAL_INVALID')
export class BankingTedIntervalInvalidException extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'BANKING_TED_INTERVAL_INVALID',
      data,
    });
  }
}
