import { Logger } from 'winston';
import { File, FileRepository } from '@zro/storage/domain';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';

export class GetAllFilesByFolderUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
  ) {
    this.logger = logger.child({
      context: GetAllFilesByFolderUseCase.name,
    });
  }

  /**
   * Get Remittance Orders  UseCase.
   *
   * @returns {StreamableFile} worksheet file.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    folderName: string,
    pagination: Pagination,
  ): Promise<TPaginationResponse<File>> {
    // Data input check
    if (!folderName || !pagination) {
      throw new MissingDataException([
        ...(!folderName ? ['Foldername'] : []),
        ...(!pagination ? ['Pagination'] : []),
      ]);
    }

    // Create file references at database and store it at disk
    const existentFiles = await this.fileRepository.getAllByFoldername(
      folderName,
      pagination,
    );

    this.logger.debug('Possible files found.', { folderName });

    return existentFiles;
  }
}
