import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import * as FormData from 'form-data';
import { STORAGE_SERVICES } from './services.constants';
import { File, FileEntity } from '@zro/storage/domain';
import {
  OfflineStorageException,
  StorageException,
} from '@zro/storage/application';
import { UploadFileResponse } from '@zro/storage/interface';

type StorageFileServiceResponse = { data: UploadFileResponse };

/**
 * StorageFileServiceRest microservice.
 */
export class StorageFileServiceRest {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   */
  constructor(
    requestId: string,
    private readonly logger: Logger,
  ) {
    this.logger = logger.child({
      context: StorageFileServiceRest.name,
      loggerId: requestId,
    });
  }

  /**
   * Call storage microservice to store a file.
   * @param payload Data.
   */
  async execute(
    id: string,
    payload: Buffer,
    folderName: string,
    filename: string,
    instanceAxios: AxiosInstance,
  ): Promise<File> {
    this.logger.debug('Store file worksheet.', { folderName, filename });

    try {
      const form = new FormData();
      form.append('file', payload, { filename });

      const { data: response } =
        await instanceAxios.post<StorageFileServiceResponse>(
          STORAGE_SERVICES.STORAGE.UPLOAD_FILE,
          form.getBuffer(),
          {
            headers: form.getHeaders(),
            params: { folderName, id },
          },
        );

      this.logger.debug('Received file message.', { data: response.data });

      return new FileEntity({
        id: response.data.id,
        fileName: response.data.fileName,
        createdAt: response.data.createdAt,
      });
    } catch (error) {
      this.logger.error('ERROR Storage request.', {
        error: error.isAxiosError ? error.message : error,
      });

      if (error.isAxiosError) {
        // Delete buffer data
        delete error.config?.data;
        throw new OfflineStorageException(error);
      }

      throw new StorageException(error.response?.data);
    }
  }
}
