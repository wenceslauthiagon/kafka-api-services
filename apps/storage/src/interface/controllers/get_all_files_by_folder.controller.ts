import { Logger } from 'winston';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import {
  AutoValidator,
  IsIsoStringDateFormat,
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { File, FileRepository } from '@zro/storage/domain';
import { GetAllFilesByFolderUseCase as UseCase } from '@zro/storage/application';

export enum GetAllFilesByFolderRequestSort {
  CREATED_AT = 'created_at',
}

export type TGetAllFilesByFolderRequest = Pagination & { folderName: string };

export class GetAllFilesByFolderRequest
  extends PaginationRequest
  implements TGetAllFilesByFolderRequest
{
  @IsString()
  folderName!: string;

  @IsOptional()
  @Sort(GetAllFilesByFolderRequestSort)
  sort?: PaginationSort;

  constructor(props: TGetAllFilesByFolderRequest) {
    super(props);
    this.folderName = props.folderName;
  }
}

export type TGetAllFilesByFolderResponseItem = Pick<
  File,
  'id' | 'fileName' | 'folderName' | 'createdAt' | 'updatedAt'
>;

export class GetAllFilesByFolderResponseItem
  extends AutoValidator
  implements TGetAllFilesByFolderResponseItem
{
  @IsUUID(4)
  id: string;

  @IsString()
  fileName: string;

  @IsString()
  folderName: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TGetAllFilesByFolderResponseItem) {
    super(props);
  }
}

export class GetAllFilesByFolderResponse extends PaginationResponse<TGetAllFilesByFolderResponseItem> {}

export class GetAllFilesByFolderController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
  ) {
    this.logger = logger.child({
      context: GetAllFilesByFolderController.name,
    });
    this.usecase = new UseCase(this.logger, this.fileRepository);
  }

  async execute(
    request: GetAllFilesByFolderRequest,
  ): Promise<GetAllFilesByFolderResponse> {
    this.logger.debug('Get all files by folder request.', { request });

    const { folderName, order, page, pageSize, sort } = request;

    const pagination = new PaginationEntity({
      order,
      page,
      pageSize,
      sort,
    });

    const files = await this.usecase.execute(folderName, pagination);

    const data = files.data.map(
      (file) =>
        new GetAllFilesByFolderResponseItem({
          id: file.id,
          fileName: file.fileName,
          folderName: file.folderName,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        }),
    );

    const response = new GetAllFilesByFolderResponse({ ...files, data });

    this.logger.info('Get all files by folder response.', { response });

    return response;
  }
}
