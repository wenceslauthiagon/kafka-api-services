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
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { CurrencyState, CurrencySymbolAlign } from '@zro/operations/domain';
import { AuthUser } from '@zro/users/domain';
import {
  GetAllCurrencyResponseItem,
  GetAllCurrencyResponse,
  GetAllCurrencyRequest,
  GetAllCurrencyRequestSort,
} from '@zro/operations/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllCurrencyServiceKafka } from '@zro/operations/infrastructure';

export class GetAllCurrencyParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllCurrencyRequestSort,
  })
  @IsOptional()
  @Sort(GetAllCurrencyRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Currency Symbol.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  symbol?: string;
}

class GetAllCurrencyRestResponseItem {
  @ApiProperty({
    description: 'Currency ID.',
  })
  id!: number;

  @ApiProperty({
    description: 'Currency title.',
  })
  title!: string;

  @ApiProperty({
    description: 'Currency symbol.',
  })
  symbol!: string;

  @ApiProperty({
    enum: CurrencySymbolAlign,
    description: 'Currency symbol align position.',
  })
  symbol_align!: CurrencySymbolAlign;

  @ApiProperty({
    description: 'Currency decimal value.',
  })
  decimal!: number;

  @ApiProperty({
    description: 'Currency tag.',
  })
  tag!: string;

  @ApiProperty({
    enum: CurrencyState,
    description: 'Currency state.',
  })
  state!: CurrencyState;

  constructor(props: GetAllCurrencyResponseItem) {
    this.id = props.id;
    this.title = props.title;
    this.symbol = props.symbol;
    this.symbol_align = props.symbolAlign;
    this.decimal = props.decimal;
    this.tag = props.tag;
    this.state = props.state;
  }
}

export class GetAllCurrencyRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Currencies data.',
    type: [GetAllCurrencyRestResponseItem],
  })
  data!: GetAllCurrencyRestResponseItem[];

  constructor(props: GetAllCurrencyResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllCurrencyRestResponseItem(item),
    );
  }
}

/**
 * Currencies controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Currency')
@Controller('operations/currencies')
@ApiBearerAuth()
@DefaultApiHeaders()
@HasPermission('api-users-get-operations-currencies')
export class GetAllCurrencyRestController {
  /**
   * get all currency endpoint.
   */
  @ApiOperation({
    summary: 'List currencies.',
    description: 'Get a list of currencies.',
  })
  @ApiOkResponse({
    description: 'The currencies returned successfully.',
    type: GetAllCurrencyRestResponse,
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
    @Query() query: GetAllCurrencyParams,
    @KafkaServiceParam(GetAllCurrencyServiceKafka)
    getAllCurrencyService: GetAllCurrencyServiceKafka,
    @LoggerParam(GetAllCurrencyRestController)
    logger: Logger,
  ): Promise<GetAllCurrencyRestResponse> {
    // GetAll payload.
    const payload: GetAllCurrencyRequest = {
      symbol: query.symbol,
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('Get All currency.', { user, payload });

    // Call get all currency service.
    const result = await getAllCurrencyService.execute(payload);

    logger.debug('Currencies found.', { result });

    const response = new GetAllCurrencyRestResponse(result);

    return response;
  }
}
