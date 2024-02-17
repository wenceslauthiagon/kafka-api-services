import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'MULTER_FILE_FORMAT')
export class FileFormatException extends DefaultException {
  constructor(format: string) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'MULTER_FILE_FORMAT',
      data: format,
    });
  }
}
