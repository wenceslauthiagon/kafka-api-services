import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class StorageException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'STORAGE_ERROR',
      data: error,
    });
  }
}
