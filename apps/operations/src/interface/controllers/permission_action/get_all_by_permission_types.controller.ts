import { Logger } from 'winston';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  AutoValidator,
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import {
  PermissionType,
  PermissionAction,
  PermissionActionRepository,
  PermissionTypeEntity,
} from '@zro/operations/domain';
import { GetAllPermissionActionByPermissionTypesUseCase as UseCase } from '@zro/operations/application';

export enum GetAllPermissionActionByPermissionTypesRequestSort {
  TAG = 'tag',
  CREATED_AT = 'created_at',
}

type TGetAllPermissionActionByPermissionTypesRequest = Pagination & {
  permissionTypeTags?: PermissionType['tag'][];
};

export class GetAllPermissionActionByPermissionTypesRequest
  extends PaginationRequest
  implements TGetAllPermissionActionByPermissionTypesRequest
{
  @IsOptional()
  @ArrayUnique()
  @ArrayMaxSize(16)
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissionTypeTags?: PermissionType['tag'][];

  @IsOptional()
  @Sort(GetAllPermissionActionByPermissionTypesRequestSort)
  sort?: PaginationSort;

  constructor(props: TGetAllPermissionActionByPermissionTypesRequest) {
    super(props);
  }
}

type TGetAllPermissionActionByPermissionTypesResponseItem = Pick<
  PermissionAction,
  'id' | 'tag'
>;

export class GetAllPermissionActionByPermissionTypesResponseItem
  extends AutoValidator
  implements TGetAllPermissionActionByPermissionTypesResponseItem
{
  @IsUUID(4)
  id: PermissionAction['id'];

  @IsString()
  tag: PermissionAction['tag'];

  constructor(props: TGetAllPermissionActionByPermissionTypesResponseItem) {
    super(props);
  }
}

export class GetAllPermissionActionByPermissionTypesResponse extends PaginationResponse<GetAllPermissionActionByPermissionTypesResponseItem> {}

export class GetAllPermissionActionByPermissionTypesController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param permissionActionRepository PermissionAction repository.
   * @param permissionTypeActionRepository PermissionTypeAction repository.
   */
  constructor(
    private logger: Logger,
    readonly permissionActionRepository: PermissionActionRepository,
    readonly permissionRootTag: string,
  ) {
    this.logger = logger.child({
      context: GetAllPermissionActionByPermissionTypesController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      permissionActionRepository,
      permissionRootTag,
    );
  }

  /**
   * Get all PermissionAction by PermissionType.
   *
   * @param request Input data.
   * @returns PermissionAction if found or empty otherwise.
   */
  async execute(
    request: GetAllPermissionActionByPermissionTypesRequest,
  ): Promise<GetAllPermissionActionByPermissionTypesResponse> {
    this.logger.debug('Get all PermissionAction by permissionTypes request.', {
      request,
    });

    const { permissionTypeTags, order, page, pageSize, sort } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const permissionTypes =
      permissionTypeTags?.length &&
      permissionTypeTags.map((tag) => new PermissionTypeEntity({ tag }));

    const result = await this.usecase.execute(pagination, permissionTypes);

    const data = result.data.map(
      (item) =>
        new GetAllPermissionActionByPermissionTypesResponseItem({
          id: item.id,
          tag: item.tag,
        }),
    );

    const response = new GetAllPermissionActionByPermissionTypesResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all PermissionAction by permissionTypes response.', {
      total: response.total,
    });

    return response;
  }
}
