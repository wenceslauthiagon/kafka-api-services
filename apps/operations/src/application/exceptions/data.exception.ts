import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'DATA_INCONSISTENT')
export class DataException extends DefaultException {
  constructor(reasonList: string[]) {
    super({
      type: ExceptionTypes.USER,
      code: 'DATA_INCONSISTENT',
      data: { reasonList },
    });
  }
}
