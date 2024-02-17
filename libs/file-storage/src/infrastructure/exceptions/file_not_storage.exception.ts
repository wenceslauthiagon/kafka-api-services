import { DefaultException, ExceptionTypes } from '@zro/common';

export class FileNotStorageException extends DefaultException {
  constructor(errorMessage?: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'FILE_NOT_STORAGE',
      data: errorMessage,
    });
  }
}
