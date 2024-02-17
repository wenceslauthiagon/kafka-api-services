import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'MAX_NUMBER_OF_KEYS_REACHED')
export class MaxNumberOfPixKeysReachedException extends DefaultException {
  constructor(numberOfKeys: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'MAX_NUMBER_OF_KEYS_REACHED',
      data: numberOfKeys,
    });
  }
}
