import { Logger } from 'winston';
import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { File, FileRepository } from '@zro/storage/domain';
import {
  StorageGateway,
  UploadFileUseCase as UseCase,
} from '@zro/storage/application';

export class UploadFileRequest {
  @ApiProperty({
    description: 'File ID.',
    example: '8eb4a5db-686d-4841-80c8-c5d3c187c261',
  })
  @IsUUID(4)
  id!: string;

  @ApiProperty({
    description: 'Folder microservice name.',
    example: 'otc',
  })
  @IsString()
  folderName!: string;
}

type TUploadFileResponse = Pick<File, 'id' | 'fileName' | 'createdAt'>;

export class UploadFileResponse
  extends AutoValidator
  implements TUploadFileResponse
{
  @IsUUID(4)
  id!: string;

  @IsString()
  fileName: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TUploadFileResponse) {
    super(props);
  }
}

function uploadFilePresenter(file: File): UploadFileResponse {
  if (!file) return null;

  const response: UploadFileResponse = {
    id: file.id,
    fileName: file.fileName,
    createdAt: file.createdAt,
  };

  return response;
}

export class UploadFileController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
    private pspGateway: StorageGateway,
  ) {
    this.logger = logger.child({ context: UploadFileController.name });
    this.usecase = new UseCase(
      this.logger,
      this.fileRepository,
      this.pspGateway,
    );
  }

  async execute(
    file: Express.Multer.File,
    request: UploadFileRequest,
  ): Promise<UploadFileResponse> {
    this.logger.debug('Try to store file request.', { request });

    const { id, folderName } = request;

    const result = await this.usecase.execute(id, folderName, file);

    this.logger.debug('Store file.', { result });

    return uploadFilePresenter(result);
  }
}
