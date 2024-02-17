import { rmSync } from 'fs';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { DeleteFileGateway } from '@zro/storage/application';
import { FileNotFoundException } from '@zro/file-storage/infrastructure';

interface DeleteFileRequest {
  filePath: string;
}

type DeleteFileResponse = void;

export class DeleteFileStorageGateway implements DeleteFileGateway {
  constructor(private logger: Logger) {
    this.logger = logger.child({ context: DeleteFileStorageGateway.name });
  }

  async deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse> {
    // Data input check
    if (!request?.filePath) {
      throw new MissingDataException(['FilePath']);
    }
    const { filePath } = request;

    this.logger.debug('Request payload.', { filePath });

    try {
      return rmSync(filePath);
    } catch (error) {
      this.logger.error('Error when try to delete file', error);
      throw new FileNotFoundException('File not found at directory');
    }
  }
}
