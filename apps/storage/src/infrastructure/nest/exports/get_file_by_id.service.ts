import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  GetFileByIdRequest,
  GetFileByIdResponse,
} from '@zro/storage/interface';
import { STORAGE_SERVICES } from './services.constants';
import {
  OfflineStorageException,
  StorageException,
} from '@zro/storage/application';

type AxiosResponse = {
  data: GetFileByIdResponse;
};

/**
 * Storage microservice.
 */
export class GetFileByIdServiceRest {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: GetFileByIdServiceRest.name });
  }

  /**
   * Call storage microservice to get a file.
   * @param payload Data.
   * @param instanceAxios instance of axios.
   */
  async execute(
    payload: GetFileByIdRequest,
    instanceAxios: AxiosInstance,
  ): Promise<GetFileByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Get file by id.', { payload });

    const url = STORAGE_SERVICES.STORAGE.GET_FILE_BY_ID(payload.id);

    try {
      const { data: response } = await instanceAxios.get<AxiosResponse>(url);

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
