import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { DeleteFileRequest } from '@zro/storage/interface';
import { STORAGE_SERVICES } from './services.constants';
import {
  OfflineStorageException,
  StorageException,
} from '@zro/storage/application';

/**
 * Storage microservice.
 */
export class DeleteFileServiceRest {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: DeleteFileServiceRest.name });
  }

  /**
   * Call storage microservice to delete a file.
   * @param payload Data.
   */
  async execute(
    payload: DeleteFileRequest,
    instanceAxios: AxiosInstance,
  ): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Delete storage file by id.', { payload });

    const deleteUrl = STORAGE_SERVICES.STORAGE.DELETE_FILE(payload.id);

    try {
      await instanceAxios.delete<void>(deleteUrl);
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
