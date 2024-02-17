import { DefaultException, ExceptionTypes } from '@zro/common';

export class InvalidDataFormatException extends DefaultException {
  constructor(invalidList: string[]) {
    super({
      message: 'Invalid data format',
      type: ExceptionTypes.USER,
      code: 'INVALID_FORMAT',
      data: {
        invalidList: invalidList?.filter((x) => x),
        count: invalidList?.length ?? 1,
      },
    });
  }
}
