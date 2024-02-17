import { S3Client } from '@aws-sdk/client-s3';
import { Logger } from 'winston';
import {
  StorageGateway,
  StorageFileRequest,
  StorageFileResponse,
  DownloadFileResponse,
  DownloadFileRequest,
  DeleteFileRequest,
  DeleteFileResponse,
} from '@zro/storage/application';
import {
  S3StorageFileGateway,
  S3DownloadFileGateway,
  S3DeleteFileGateway,
} from '@zro/s3-storage/infrastructure';

export class S3StorageGateway implements StorageGateway {
  public static PROVIDER = 'AWS_S3';
  constructor(
    private logger: Logger,
    private bucketName: string,
    private s3: S3Client,
  ) {
    this.logger = logger.child({ context: S3StorageGateway.name });
  }

  getProviderName(): string {
    return S3StorageGateway.PROVIDER;
  }

  downloadFile(request: DownloadFileRequest): Promise<DownloadFileResponse> {
    const gateway = new S3DownloadFileGateway(
      this.logger,
      this.bucketName,
      this.s3,
    );

    return gateway.downloadFile(request);
  }

  deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse> {
    const gateway = new S3DeleteFileGateway(
      this.logger,
      this.bucketName,
      this.s3,
    );

    return gateway.deleteFile(request);
  }

  async storageFile(request: StorageFileRequest): Promise<StorageFileResponse> {
    this.logger.debug('Store file at storage.', { request });

    const gateway = new S3StorageFileGateway(
      this.logger,
      this.bucketName,
      this.s3,
    );

    return gateway.storageFile(request);
  }
}
