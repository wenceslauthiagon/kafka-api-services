import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { File, FileRepository } from '@zro/storage/domain';
import { FileNotFoundException } from '@zro/storage/application';

export class GetFileByIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
  ) {
    this.logger = logger.child({ context: GetFileByIdUseCase.name });
  }

  /**
   * Get file by id use case.
   * @param id unique identifier.
   * @returns File entity.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<File> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get file by id at database
    const file = await this.fileRepository.getById(id);

    // If file not found throw an exception
    if (!file) throw new FileNotFoundException({ id });

    this.logger.debug('File found.', { file });

    return file;
  }
}
