import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
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
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { CurrencyState, CurrencySymbolAlign } from '@zro/operations/domain';
import {
  GetAllCurrencyResponseItem,
  GetAllCurrencyResponse,
  GetAllCurrencyRequest,
  GetAllCurrencyRequestSort,
} from '@zro/operations/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
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
    description: 'Currency ID.',
  })
  @IsOptional()
  @IsInt()
  @Transform((params) => params && parseInt(params.value))
  id?: number;

  @ApiPropertyOptional({
    description: 'Currency title.',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Currency symbol.',
  })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({
    enum: CurrencySymbolAlign,
    description: 'Currency symbol align position.',
  })
  @IsOptional()
  @IsEnum(CurrencySymbolAlign)
  symbol_align?: CurrencySymbolAlign;

  @ApiPropertyOptional({
    description: 'Currency decimal value.',
  })
  @IsOptional()
  @IsInt()
  @Transform((params) => params && parseInt(params.value))
  decimal?: number;

  @ApiPropertyOptional({
    description: 'Currency tag.',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    enum: CurrencyState,
    description: 'Currency state.',
  })
  @IsOptional()
  @IsEnum(CurrencyState)
  state?: CurrencyState;
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
  data: GetAllCurrencyRestResponseItem[];

  constructor(props: GetAllCurrencyResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllCurrencyRestResponseItem(item),
    );
  }
}

/**
 * Currency controller. It is protected by JWT access token.
 */
@ApiTags('Currency')
@ApiBearerAuth()
@Controller('operations/currencies')
export class GetAllCurrencyRestController {
  /**
   * Get Currency endpoint.
   */
  @ApiOperation({
    summary: 'List Currencies.',
    description: 'Get a list of currencies.',
  })
  @ApiOkResponse({
    description: 'The currencies had return successfully.',
    type: GetAllCurrencyRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
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
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(GetAllCurrencyServiceKafka)
    getAllService: GetAllCurrencyServiceKafka,
    @LoggerParam(GetAllCurrencyRestController)
    logger: Logger,
    @Query() params: GetAllCurrencyParams,
  ): Promise<GetAllCurrencyRestResponse> {
    // Get all request payload.
    const payload: GetAllCurrencyRequest = {
      id: params.id,
      title: params.title,
      symbol: params.symbol,
      symbolAlign: params.symbol_align,
      tag: params.tag,
      decimal: params.decimal,
      state: params.state,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Get all currencies.', { admin, payload });

    // Call get currencies service.
    const result = await getAllService.execute(payload);

    logger.debug('Currencies found.', { result });

    const response = new GetAllCurrencyRestResponse(result);

    return response;
  }
}
