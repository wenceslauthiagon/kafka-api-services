import * as path from 'path';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { File, FileEntity, FileRepository } from '@zro/storage/domain';
import {
  StorageGateway,
  FileAlreadyExistsException,
} from '@zro/storage/application';

export class UploadFileUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
    private pspGateway: StorageGateway,
  ) {
    this.logger = logger.child({ context: UploadFileUseCase.name });
  }

  async execute(
    id: string,
    folderName: string,
    fileMulter: Express.Multer.File,
  ): Promise<File> {
    // Check if there is any data
    if (!id || !fileMulter || !folderName) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!fileMulter.path ? ['FilePath'] : []),
        ...(!fileMulter.originalname ? ['FileName'] : []),
        ...(!folderName ? ['FolderName'] : []),
      ]);
    }

    const existFile = await this.fileRepository.getById(id);

    this.logger.debug('File found.', { existFile });

    if (existFile) {
      throw new FileAlreadyExistsException({ id });
    }

    const fileName = `${id}-${fileMulter.originalname.trim().toLowerCase()}`;

    const newPath = path.join(folderName, fileName);

    const newFile = new FileEntity({
      id,
      fileName,
      folderName,
      gatewayName: this.pspGateway.getProviderName(),
    });

    // Store new file reference at database
    await this.fileRepository.create(newFile);

    this.logger.debug('File was created.', { newFile });

    await this.pspGateway.storageFile({
      oldPath: fileMulter.path,
      newPath,
    });

    return newFile;
  }
}
