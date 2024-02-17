import { Logger } from 'winston';
import { rename } from 'fs/promises';
import { MissingDataException } from '@zro/common';
import { StorageFileGateway } from '@zro/storage/application';
import { FileNotStorageException } from '../exceptions/file_not_storage.exception';

type StorageFileRequest = {
  oldPath: string;
  newPath: string;
};

interface StorageFileResponse {
  success: boolean;
}

export class StorageFileStorageGateway implements StorageFileGateway {
  constructor(private logger: Logger) {
    this.logger = logger.child({ context: StorageFileStorageGateway.name });
  }

  async storageFile(request: StorageFileRequest): Promise<StorageFileResponse> {
    // Data input check
    const { oldPath, newPath } = request;

    if (!oldPath || !newPath) {
      throw new MissingDataException([
        ...(!oldPath ? ['Path File Microservice'] : []),
        ...(!newPath ? ['Path File LIB'] : []),
      ]);
    }

    try {
      await rename(oldPath, newPath);
      return { success: true };
    } catch (error) {
      this.logger.error(error.message, { stack: error.stack });
      throw new FileNotStorageException(error);
    }
  }
}
