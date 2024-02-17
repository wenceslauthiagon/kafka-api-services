import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional } from 'class-validator';
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
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  RequestId,
  Sort,
  InjectLogger,
} from '@zro/common';
import {
  GetAllSpreadResponseItem,
  GetAllSpreadResponse,
  GetAllSpreadRequest,
  GetAllSpreadRequestSort,
} from '@zro/otc/interface';
import {
  AuthAdminParam,
  GetAllSpreadServiceKafka,
} from '@zro/api-admin/infrastructure';
import { AuthAdmin } from '@zro/api-admin/domain';

export class GetAllSpreadParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllSpreadRequestSort,
  })
  @IsOptional()
  @Sort(GetAllSpreadRequestSort)
  sort?: PaginationSort;
}

class GetAllSpreadRestResponseItem {
  @ApiProperty({
    description: 'Spread ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Spread buy.',
    example: '1',
  })
  buy!: number;

  @ApiProperty({
    description: 'Spread sell.',
    example: '1',
  })
  sell!: number;

  @ApiProperty({
    description: 'Spread amount.',
    example: '1',
  })
  amount!: number;

  @ApiProperty({
    description: 'Spread base id.',
  })
  currency_id!: number;

  @ApiProperty({
    description: 'Spread base symbol.',
    example: 'USD',
  })
  currency_symbol!: string;

  @ApiProperty({
    description: 'Spread created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetAllSpreadResponseItem) {
    this.id = props.id;
    this.buy = props.buy;
    this.sell = props.sell;
    this.amount = props.amount;
    this.currency_id = props.currencyId;
    this.currency_symbol = props.currencySymbol;
    this.created_at = props.createdAt;
  }
}

export class GetAllSpreadRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Spreads data.',
    type: [GetAllSpreadRestResponseItem],
  })
  data!: GetAllSpreadRestResponseItem[];

  constructor(props: GetAllSpreadResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllSpreadRestResponseItem(item),
    );
  }
}

/**
 * Spreads controller. Controller is protected by JWT access token.
 */
@ApiTags('Spread')
@ApiBearerAuth()
@Controller()
export class GetAllSpreadRestController {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param getAllService create microservice.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly getAllService: GetAllSpreadServiceKafka,
  ) {
    this.logger = logger.child({
      context: GetAllSpreadRestController.name,
    });
  }

  /**
   * list spread endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: 'List the spreads.',
    description:
      'List the spreads. <b>Must use the path "quotations/spreads".</b>',
  })
  @ApiOkResponse({
    description: 'The spreads returned successfully.',
    type: GetAllSpreadRestResponse,
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
  @Get('otc/spreads')
  async executeOld(
    @AuthAdminParam() admin: AuthAdmin,
    @RequestId() requestId: string,
    @Query() params: GetAllSpreadParams,
  ): Promise<GetAllSpreadRestResponse> {
    return this.execute(admin, requestId, params);
  }

  /**
   * list spread endpoint.
   */
  @ApiOperation({
    summary: 'List the spreads.',
    description: 'List the spreads.',
  })
  @ApiOkResponse({
    description: 'The spreads returned successfully.',
    type: GetAllSpreadRestResponse,
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
  @Get('quotations/spreads')
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @RequestId() requestId: string,
    @Query() params: GetAllSpreadParams,
  ): Promise<GetAllSpreadRestResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // GetAll a payload.
    const payload: GetAllSpreadRequest = {
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('GetAll spreads.', { admin });

    // Call create spread service.
    const result = await this.getAllService.execute(requestId, payload);

    logger.debug('Spreads found.', { result });

    const response = new GetAllSpreadRestResponse(result);

    return response;
  }
}
