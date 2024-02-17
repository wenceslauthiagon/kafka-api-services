import { Logger } from 'winston';
import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import {
  DownloadFileUseCase as UseCase,
  StorageGateway,
} from '@zro/storage/application';

export class DownloadFileRequest {
  @ApiProperty({
    description: 'File id.',
    example: 'bdb98227-3e02-4fa2-8e71-bfb8e4b4310a',
  })
  @IsUUID(4)
  id!: string;
}

export class DownloadFileResponse extends AutoValidator {
  @IsObject()
  fileStream: Buffer;

  @IsString()
  fileName: string;
}

export class DownloadFileController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
    private storageGateway: StorageGateway,
  ) {
    this.logger = logger.child({ context: DownloadFileController.name });
    this.usecase = new UseCase(
      this.logger,
      this.fileRepository,
      this.storageGateway,
    );
  }

  async execute(request: DownloadFileRequest): Promise<DownloadFileResponse> {
    this.logger.debug('Try to download worksheet file.', { request });

    const { id } = request;

    const result = await this.usecase.execute(id);

    if (!result) return null;

    const response = new DownloadFileResponse({
      fileStream: result.fileStream,
      fileName: result.file.fileName,
    });

    this.logger.debug('Download worksheet file.');

    return response;
  }
}
