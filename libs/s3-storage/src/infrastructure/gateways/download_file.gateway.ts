import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { DownloadFileGateway } from '@zro/storage/application';
import { FileNotStorageException } from '@zro/file-storage/infrastructure';

interface DownloadFileRequest {
  filePath: string;
}

type DownloadFileResponse = Buffer;

export class S3DownloadFileGateway implements DownloadFileGateway {
  constructor(
    private logger: Logger,
    private bucketName: string,
    private readonly s3: S3Client,
  ) {
    this.logger = logger.child({ context: S3DownloadFileGateway.name });
  }

  async downloadFile(
    request: DownloadFileRequest,
  ): Promise<DownloadFileResponse> {
    // Data input check
    if (!request?.filePath) {
      throw new MissingDataException(['FilePath']);
    }
    const { filePath } = request;

    this.logger.debug('Request download payload.', { filePath });

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    try {
      const response = await this.s3.send(command);
      const str = await response.Body.transformToString('base64');

      return Buffer.from(str, 'base64');
    } catch (error) {
      this.logger.error(error.message, { stack: error.stack });
      throw new FileNotStorageException();
    }
  }
}
