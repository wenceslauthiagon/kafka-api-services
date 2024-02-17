import { Logger } from 'winston';
import {
  StorageGateway,
  StorageFileRequest,
  StorageFileResponse,
  DownloadFileRequest,
  DownloadFileResponse,
  DeleteFileRequest,
  DeleteFileResponse,
} from '@zro/storage/application';
import {
  StorageFileStorageGateway,
  DownloadFileStorageGateway,
  DeleteFileStorageGateway,
} from '@zro/file-storage/infrastructure';

export class StorageFileGateway implements StorageGateway {
  public static PROVIDER = 'FILE_STORAGE';
  constructor(private logger: Logger) {
    this.logger = logger.child({ context: StorageFileGateway.name });
  }

  getProviderName(): string {
    return StorageFileGateway.PROVIDER;
  }

  async storageFile(request: StorageFileRequest): Promise<StorageFileResponse> {
    this.logger.debug('Store file at storage.', { request });

    const gateway = new StorageFileStorageGateway(this.logger);

    return gateway.storageFile(request);
  }

  async downloadFile(
    request: DownloadFileRequest,
  ): Promise<DownloadFileResponse> {
    this.logger.debug('Get file from storage.', { request });

    const gateway = new DownloadFileStorageGateway(this.logger);

    return gateway.downloadFile(request);
  }

  async deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse> {
    this.logger.debug('Delete file from storage.', { request });

    const gateway = new DeleteFileStorageGateway(this.logger);

    return gateway.deleteFile(request);
  }
}
