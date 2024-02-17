import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger } from 'winston';
import { rmSync } from 'fs';
import { readFile } from 'fs/promises';
import { MissingDataException } from '@zro/common';
import { StorageFileGateway } from '@zro/storage/application';
import { FileNotStorageException } from '@zro/file-storage';

type StorageFileRequest = {
  oldPath: string;
  newPath: string;
};

interface StorageFileResponse {
  success: boolean;
}

export class S3StorageFileGateway implements StorageFileGateway {
  constructor(
    private logger: Logger,
    private bucketName: string,
    private readonly s3: S3Client,
  ) {
    this.logger = logger.child({ context: S3StorageFileGateway.name });
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

    const fileName = newPath;
    const fileData = await readFile(oldPath);

    this.logger.info({ bucketName: this.bucketName, fileName });

    await rmSync(oldPath);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileData,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      this.logger.error(error.message, { stack: error.stack });
      throw new FileNotStorageException();
    }

    return { success: true };
  }
}
