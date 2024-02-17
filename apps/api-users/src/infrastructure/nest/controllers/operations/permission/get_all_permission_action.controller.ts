import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  DefaultApiHeaders,
  HasPermission,
  TranslateService,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import {
  GetAllPermissionActionByPermissionTypesResponseItem,
  GetAllPermissionActionByPermissionTypesResponse,
  GetAllPermissionActionByPermissionTypesRequest,
  GetAllPermissionActionByPermissionTypesRequestSort,
} from '@zro/operations/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllPermissionActionByPermissionTypesServiceKafka } from '@zro/operations/infrastructure';

type GetAllPermissionActionWithNameResponseItem =
  GetAllPermissionActionByPermissionTypesResponseItem & { name: string };

class GetAllPermissionActionByPermissionTypesParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPermissionActionByPermissionTypesRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPermissionActionByPermissionTypesRequestSort)
  sort?: PaginationSort;

  @ApiProperty({
    description: 'Permission type.',
    example: ['CLIENT'],
    isArray: true,
    required: false,
  })
  @Transform((params) => {
    if (!params.value) return null;
    return Array.isArray(params.value) ? params.value : [params.value];
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(16)
  @IsString({ each: true })
  permission_types?: string[];
}

class GetAllPermissionActionByPermissionTypesRestResponseItem {
  @ApiProperty({
    description: 'The permission action id.',
    example: '612b77e1-5b93-4985-bfc2-6b8f3f09b58a',
  })
  id: string;

  @ApiProperty({
    description: 'The permission action tag.',
    example: 'get-operations',
  })
  tag: string;

  @ApiProperty({
    description: 'The permission action name.',
    example: 'List operations',
  })
  name: string;

  constructor(props: GetAllPermissionActionWithNameResponseItem) {
    this.id = props.id;
    this.tag = props.tag;
    this.name = props.name;
  }
}

class GetAllPermissionActionByPermissionTypesRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Permission action data.',
    type: [GetAllPermissionActionByPermissionTypesRestResponseItem],
  })
  data!: GetAllPermissionActionByPermissionTypesRestResponseItem[];

  constructor(props: GetAllPermissionActionByPermissionTypesResponse) {
    super(props);
  }
}

/**
 * WalletInvitation by user controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Permissions')
@DefaultApiHeaders()
@ApiBearerAuth()
@Controller('operations/permissions/actions')
@HasPermission('api-users-get-operations-permissions-actions')
export class GetAllPermissionActionByPermissionTypesRestController {
  constructor(private readonly translateService: TranslateService) {}

  /**
   * get walletInvitations endpoint.
   */
  @ApiOperation({
    summary: 'Get permission actions.',
    description:
      'Get all permission action tags and names. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'The permission actions returned successfully.',
    type: GetAllPermissionActionByPermissionTypesRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Query() query: GetAllPermissionActionByPermissionTypesParams,
    @KafkaServiceParam(GetAllPermissionActionByPermissionTypesServiceKafka)
    service: GetAllPermissionActionByPermissionTypesServiceKafka,
    @LoggerParam(GetAllPermissionActionByPermissionTypesRestController)
    logger: Logger,
  ): Promise<GetAllPermissionActionByPermissionTypesRestResponse> {
    // GetAll payload.
    const payload: GetAllPermissionActionByPermissionTypesRequest = {
      permissionTypeTags: query.permission_types,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll permissionActions.', { user, payload });

    // Call get all permissionAction service.
    const result = await service.execute(payload);

    logger.debug('PermissionActions found.', { result });

    const response = new GetAllPermissionActionByPermissionTypesRestResponse(
      result,
    );
    response.data = await Promise.all(
      result.data.map(
        async (item) =>
          new GetAllPermissionActionByPermissionTypesRestResponseItem({
            ...item,
            name: await this.translateService.translate(
              'operation_permission_action_tag',
              item.tag,
            ),
          }),
      ),
    );

    return response;
  }
}
