import { DefaultException, ExceptionTypes } from '@zro/common';

export class FileNotFoundException extends DefaultException {
  constructor(errorMessage: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'FILE_NOT_FOUND',
      data: errorMessage,
    });
  }
}
