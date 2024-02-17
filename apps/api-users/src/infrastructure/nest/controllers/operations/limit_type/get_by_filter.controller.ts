import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
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
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetLimitTypesByFilterServiceKafka } from '@zro/operations/infrastructure';
import {
  GetLimitTypesByFilterRequest,
  GetLimitTypesByFilterRequestSort,
  GetLimitTypesByFilterResponse,
  GetLimitTypeByFilterItem,
} from '@zro/operations/interface';

export class GetLimitTypesByFilterRestParamsRequest extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetLimitTypesByFilterRequestSort,
  })
  @IsOptional()
  @Sort(GetLimitTypesByFilterRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty({
    description: 'Tag.',
    example: 'PIX',
  })
  @IsString()
  @MaxLength(100)
  tag?: string;

  @ApiPropertyOptional()
  @ApiProperty({
    description: 'Transaction type tag.',
    example: 'PIXCHANGE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  transaction_type_tag?: string;
}

class GetLimitTypesByFilterRestResponseItem {
  @ApiProperty({
    description: 'Limit type id.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tag.',
    example: 'PIX',
  })
  tag: string;

  constructor(props: GetLimitTypeByFilterItem) {
    this.id = props.id;
    this.tag = props.tag;
  }
}

export class GetLimitTypesByFilterRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Limit types data.',
    type: [GetLimitTypesByFilterRestResponseItem],
  })
  data!: GetLimitTypesByFilterRestResponseItem[];

  constructor(props: GetLimitTypesByFilterResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetLimitTypesByFilterRestResponseItem(item),
    );
  }
}

/**
 * Get limit types by filter controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Limit Types')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('limits/types')
@HasPermission('api-users-get-limit-types')
export class GetLimitTypesByFilterRestController {
  /**
   * Get limit types by filter endpoint.
   */
  @ApiOperation({
    summary: 'Get limit types by filter.',
    description: 'Get user limits by filter.',
  })
  @ApiOkResponse({
    description: 'The limit types filtered.',
    type: GetLimitTypesByFilterRestResponse,
  })
  @ApiUnauthorizedResponse({ description: 'User authentication failed.' })
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
    @LoggerParam(GetLimitTypesByFilterRestController)
    logger: Logger,
    @KafkaServiceParam(GetLimitTypesByFilterServiceKafka)
    getLimitTypesByFilterService: GetLimitTypesByFilterServiceKafka,
    @Query() params: GetLimitTypesByFilterRestParamsRequest,
  ): Promise<GetLimitTypesByFilterRestResponse> {
    // GetAll a payload.
    const payload: GetLimitTypesByFilterRequest = {
      tag: params.tag,
      transactionTypeTag: params.transaction_type_tag,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Get limit types by filter.', { user, payload });

    // Call get limit types by filter service.
    const result = await getLimitTypesByFilterService.execute(payload);

    logger.debug('Limit types found.', { result });

    const response = new GetLimitTypesByFilterRestResponse(result);

    return response;
  }
}
