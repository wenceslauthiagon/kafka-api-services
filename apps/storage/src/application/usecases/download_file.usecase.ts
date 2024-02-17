import { Logger } from 'winston';
import { File, FileRepository } from '@zro/storage/domain';
import {
  FileNotFoundException,
  StorageGateway,
  DownloadFileRequest,
} from '@zro/storage/application';
import { MissingDataException } from '@zro/common';

export interface DonwloadFile {
  /**
   * File found.
   */
  fileStream?: Buffer;

  /**
   * Object file.
   */
  file?: File;
}

export class DownloadFileUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
    private pspGateway: StorageGateway,
  ) {
    this.logger = logger.child({
      context: DownloadFileUseCase.name,
    });
  }

  /**
   * Get Remittance Orders  UseCase.
   *
   * @returns {StreamableFile} worksheet file.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<DonwloadFile> {
    //Check if there is any data
    if (!id) throw new MissingDataException(['ID']);

    // Create file references at database and store it at disk
    const existentFile = await this.fileRepository.getById(id);

    if (!existentFile)
      throw new FileNotFoundException({
        id,
      });

    const { folderName, fileName } = existentFile;

    const path = `${folderName}/${fileName}`;

    this.logger.debug('File path found.', { path });

    const gatewayRequest: DownloadFileRequest = {
      filePath: path,
    };

    const fileStream = await this.pspGateway.downloadFile(gatewayRequest);

    return { fileStream, file: existentFile };
  }
}
