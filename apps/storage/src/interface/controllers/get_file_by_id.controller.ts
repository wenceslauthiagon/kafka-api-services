import { Logger } from 'winston';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { File, FileRepository } from '@zro/storage/domain';
import { GetFileByIdUseCase as UseCase } from '@zro/storage/application';

export class GetFileByIdRequest {
  @ApiProperty({
    description: 'File ID.',
    example: 'bdb98227-3e02-4fa2-8e71-bfb8e4b4310a',
  })
  @IsUUID(4)
  id!: string;
}

type TGetFileByIdResponse = Pick<File, 'id' | 'fileName' | 'createdAt'>;

export class GetFileByIdResponse
  extends AutoValidator
  implements TGetFileByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  fileName: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetFileByIdResponse) {
    super(props);
  }
}

export class GetFileByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
  ) {
    this.logger = logger.child({ context: GetFileByIdController.name });
    this.usecase = new UseCase(this.logger, this.fileRepository);
  }

  async execute(request: GetFileByIdRequest): Promise<GetFileByIdResponse> {
    this.logger.debug('Try to get a single file passing id.', { request });

    const { id } = request;

    const result = await this.usecase.execute(id);

    if (!result) return null;

    const response = new GetFileByIdResponse({
      id: result.id,
      fileName: result.fileName,
      createdAt: result.createdAt,
    });

    this.logger.debug('Bring file data from database.', { response });

    return response;
  }
}
