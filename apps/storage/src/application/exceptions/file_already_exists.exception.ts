import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { File } from '@zro/storage/domain';

@Exception(ExceptionTypes.USER, 'FILE_ALREADY_EXISTS')
export class FileAlreadyExistsException extends DefaultException {
  constructor(file: Partial<File>) {
    super({
      type: ExceptionTypes.ADMIN,
      code: 'FILE_ALREADY_EXISTS',
      data: file,
    });
  }
}
