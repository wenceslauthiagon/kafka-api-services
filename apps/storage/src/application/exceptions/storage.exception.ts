import {
  ExceptionTypes,
  DefaultException,
  GatewayException,
  Exception,
} from '@zro/common';

@Exception(ExceptionTypes.USER, 'STORAGE_OFFLINE')
export class OfflineStorageException extends DefaultException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'STORAGE_OFFLINE',
      data: error,
    });
  }
}

export class StorageException extends GatewayException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: error?.message ?? 'STORAGE_FAILED',
      data: error?.stack ?? null,
    });
  }
}
