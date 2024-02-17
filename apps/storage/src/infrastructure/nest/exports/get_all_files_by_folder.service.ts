import { Logger } from 'winston';
import {
  GetAllFilesByFolderRequest,
  GetAllFilesByFolderResponse,
} from '@zro/storage/interface';
import { AxiosInstance } from 'axios';
import { STORAGE_SERVICES } from './services.constants';
import {
  OfflineStorageException,
  StorageException,
} from '@zro/storage/application';

export type GetAllFilesByFolderServiceResponse = GetAllFilesByFolderResponse;

export type AxiosResponse = {
  data: GetAllFilesByFolderServiceResponse;
};

/**
 * GetAllFilesByFolderServiceRest microservice.
 */
export class GetAllFilesByFolderServiceRest {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
  ) {
    this.logger = logger.child({
      context: GetAllFilesByFolderServiceRest.name,
    });
  }

  /**
   * Call storage microservice to get a file.
   * @param payload Data.
   */
  async execute(
    payload: GetAllFilesByFolderRequest,
    instanceAxios: AxiosInstance,
  ): Promise<GetAllFilesByFolderResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Get all storage files by folder.', { payload });

    try {
      const { page, order, sort, pageSize, folderName } = payload;
      const paginationParams = {
        ...(page && { page: `page=${page}&` }),
        ...(pageSize && { pageSize: `size=${pageSize}&` }),
        ...(sort && { sort: `sort=${sort}&` }),
        ...(order && { order: `order=${order}&` }),
      };
      const { data: response } = await instanceAxios.get<AxiosResponse>(
        `${STORAGE_SERVICES.STORAGE.GET_FILE}?${Object.values(
          paginationParams,
        ).join('')}folderName=${folderName}`,
      );

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
