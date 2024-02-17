import { Logger } from 'winston';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { FileEntity, FileRepository } from '@zro/storage/domain';
import {
  DeleteFileUseCase as UseCase,
  StorageGateway,
} from '@zro/storage/application';

export class DeleteFileRequest {
  @ApiProperty({
    description: 'File id.',
    example: 'bdb98227-3e02-4fa2-8e71-bfb8e4b4310a',
  })
  @IsUUID(4)
  id!: string;
}

export class DeleteFileController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
    private storageGateway: StorageGateway,
  ) {
    this.logger = logger.child({ context: DeleteFileController.name });
    this.usecase = new UseCase(
      this.logger,
      this.fileRepository,
      this.storageGateway,
    );
  }

  async execute(request: DeleteFileRequest): Promise<void> {
    this.logger.debug('Try to soft delete file.', { request });

    const { id } = request;

    const file = new FileEntity({
      id,
    });

    await this.usecase.execute(file);

    this.logger.debug('Soft delete at file.');
  }
}
