import { Logger } from 'winston';
import { File, FileRepository } from '@zro/storage/domain';
import {
  FileNotFoundException,
  StorageGateway,
  DeleteFileRequest,
} from '@zro/storage/application';
import { MissingDataException } from '@zro/common';

export class DeleteFileUseCase {
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
      context: DeleteFileUseCase.name,
    });
  }

  /**
   * Delete file usecase.
   * @param {File} file file id.
   * @returns {void} none.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(file: File): Promise<void> {
    //Check if there is any data
    if (!file || !file.id)
      throw new MissingDataException([
        ...(!file ? ['File'] : []),
        ...(!file.id ? ['File ID'] : []),
      ]);

    const { id } = file;

    // Check if file entity exists in database
    const existentFile = await this.fileRepository.getById(id);

    if (!existentFile)
      throw new FileNotFoundException({
        id,
      });

    const { folderName, fileName } = existentFile;

    const path = `${folderName}/${fileName}`;

    this.logger.debug('File path found.', { path });

    existentFile.deletedAt = new Date();

    await this.fileRepository.update(existentFile);

    this.logger.debug('Soft delete at file in database.', { fileId: id });

    const gatewayRequest: DeleteFileRequest = {
      filePath: path,
    };

    this.logger.debug('Tracking storage gateway to soft delete file at path.', {
      filePath: path,
    });

    await this.pspGateway.deleteFile(gatewayRequest);
  }
}
