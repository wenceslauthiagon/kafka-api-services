import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { File } from '@zro/storage/domain';
import { StorageService } from '@zro/otc/application';
import { StorageFileServiceRest } from '@zro/storage/infrastructure';

export class StorageServiceRest implements StorageService {
  private storageFileService: StorageFileServiceRest;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: StorageServiceRest.name,
    });
    this.storageFileService = new StorageFileServiceRest(
      this.requestId,
      this.logger,
    );
  }

  /**
   * Store file at storage microservice.
   * @param file Buffer type.
   * @returns File if found or null otherwise.
   */
  async uploadFile(
    id: string,
    file: Buffer,
    folderName: string,
    fileName: string,
    instanceAxios: AxiosInstance,
  ): Promise<File> {
    this.logger.debug('Send storage file for storage microservice.');

    const result = await this.storageFileService.execute(
      id,
      file,
      folderName,
      fileName,
      instanceAxios,
    );

    this.logger.debug('File sent.', { result });

    return result;
  }
}
