import { readFileSync } from 'fs';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { DownloadFileGateway } from '@zro/storage/application';
import { FileNotFoundException } from '@zro/file-storage/infrastructure';

interface DownloadFileRequest {
  filePath: string;
}

type DownloadFileResponse = Buffer;

export class DownloadFileStorageGateway implements DownloadFileGateway {
  constructor(private logger: Logger) {
    this.logger = logger.child({ context: DownloadFileStorageGateway.name });
  }

  async downloadFile(
    request: DownloadFileRequest,
  ): Promise<DownloadFileResponse> {
    // Data input check
    if (!request?.filePath) {
      throw new MissingDataException(['FilePath']);
    }
    const { filePath } = request;

    this.logger.debug('Request payload.', { filePath });

    try {
      return readFileSync(filePath);
    } catch (error) {
      this.logger.error('Error when get file', error);
      throw new FileNotFoundException('File not found at directory');
    }
  }
}
