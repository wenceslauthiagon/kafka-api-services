import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  DownloadFileRequest,
  DownloadFileResponse,
} from '@zro/storage/interface';
import { STORAGE_SERVICES } from './services.constants';
import {
  OfflineStorageException,
  StorageException,
} from '@zro/storage/application';

/**
 * DownloadFileServiceRest microservice.
 */
export class DownloadFileServiceRest {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: DownloadFileServiceRest.name });
  }

  /**
   * Call storage microservice to get a file.
   * @param payload Data.
   */
  async execute(
    payload: DownloadFileRequest,
    instanceAxios: AxiosInstance,
  ): Promise<DownloadFileResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Download storage file.', { payload });

    const downloadUrl = STORAGE_SERVICES.STORAGE.DOWNLOAD_FILE(payload.id);

    try {
      const response =
        await instanceAxios.get<DownloadFileResponse>(downloadUrl);

      return response.data;
    } catch (error) {
      this.logger.error('ERROR Storage request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error.isAxiosError) {
        throw new OfflineStorageException(error);
      }

      throw new StorageException(error.response?.data);
    }
  }
}
