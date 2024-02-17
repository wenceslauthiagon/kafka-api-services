import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'MULTER_FILE_SIZE')
export class FileSizeException extends DefaultException {
  constructor(size: string) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'MULTER_FILE_SIZE',
      data: size,
    });
  }
}
