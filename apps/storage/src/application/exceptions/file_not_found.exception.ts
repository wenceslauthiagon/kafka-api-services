import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { File } from '@zro/storage/domain';

@Exception(ExceptionTypes.USER, 'FILE_NOT_FOUND')
export class FileNotFoundException extends DefaultException {
  constructor(file: Partial<File>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'FILE_NOT_FOUND',
      data: file,
    });
  }
}
