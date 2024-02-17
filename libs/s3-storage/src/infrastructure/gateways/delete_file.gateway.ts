import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { DeleteFileGateway } from '@zro/storage/application';
import { FileNotStorageException } from '@zro/file-storage/infrastructure';

interface DeleteFileRequest {
  filePath: string;
}

type DeleteFileResponse = void;

export class S3DeleteFileGateway implements DeleteFileGateway {
  constructor(
    private logger: Logger,
    private bucketName: string,
    private readonly s3: S3Client,
  ) {
    this.logger = logger.child({ context: S3DeleteFileGateway.name });
  }

  async deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse> {
    // Data input check
    if (!request?.filePath) {
      throw new MissingDataException(['FilePath']);
    }
    const { filePath } = request;

    this.logger.debug('Request delete payload.', { filePath });

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      this.logger.error(error.message, { stack: error.stack });
      throw new FileNotStorageException();
    }
  }
}
