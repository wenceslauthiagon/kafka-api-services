import { Logger } from 'winston';
import { Controller, Get, Query, Version } from '@nestjs/common';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
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
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  HasPermission,
  DefaultApiHeaders,
} from '@zro/common';
import { OrderSide } from '@zro/otc/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllConversionServiceKafka } from '@zro/otc/infrastructure';
import {
  GetAllConversionResponseItem,
  GetAllConversionResponse,
  GetAllConversionRequest,
  GetAllConversionRequestSort,
} from '@zro/otc/interface';

class V3GetAllConversionParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllConversionRequestSort,
  })
  @IsOptional()
  @Sort(GetAllConversionRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Operation ID for conversion.',
  })
  @IsOptional()
  @IsUUID(4)
  operation_id?: string;

  @ApiPropertyOptional({
    description: 'Currency Symbol for conversion.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  currency_symbol?: string;

  @ApiPropertyOptional({
    description: 'Quotation ID for conversion.',
  })
  @IsOptional()
  @IsUUID(4)
  quotation_id?: string;

  @ApiPropertyOptional({
    description: 'Conversion type.',
    enum: OrderSide,
  })
  @IsOptional()
  @IsEnum(OrderSide)
  conversion_type?: OrderSide;

  @ApiPropertyOptional({
    description: 'Created at start for any conversion.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('created_at_end', false)
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'Created at end for any conversion.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('created_at_start', false)
  created_at_end?: Date;
}

class V3GetAllConversionRestResponseItem {
  @ApiProperty({
    description: 'Conversion UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id: string;

  @ApiProperty({
    description: 'Operation UUID. Used to track the conversion.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  operation_id: string;

  @ApiPropertyOptional({
    description:
      'Quotation UUID. Used to track the quotation for this conversion.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  @IsOptional()
  quotation_id?: string;

  @ApiProperty({
    description: 'Conversion price.',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiProperty({
    enum: OrderSide,
    description: 'Conversion side.',
    example: OrderSide.BUY,
  })
  @IsEnum(OrderSide)
  side: OrderSide;

  @ApiProperty({
    description: 'Conversion quote amount.',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  quote_amount?: number;

  @ApiProperty({
    description: 'Conversion quote currency symbol.',
    example: 'BRL',
  })
  @IsString()
  @IsOptional()
  quote_currency_symbol?: string;

  @ApiProperty({
    description: 'Conversion quote currency decimal.',
    example: '2',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  quote_currency_decimal?: number;

  @ApiProperty({
    description: 'Conversion quote currency title.',
    example: 'Real',
  })
  @IsString()
  @IsOptional()
  quote_currency_title?: string;

  @ApiProperty({
    description: 'Conversion base amount.',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  base_amount?: number;

  @ApiProperty({
    description: 'Conversion base currency symbol.',
    example: 'BTC',
  })
  @IsString()
  @IsOptional()
  base_currency_symbol?: string;

  @ApiProperty({
    description: 'Conversion base currency decimal.',
    example: '8',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  base_currency_decimal?: number;

  @ApiProperty({
    description: 'Conversion base currency title.',
    example: 'Real',
  })
  @IsString()
  @IsOptional()
  base_currency_title?: string;

  @ApiPropertyOptional({
    description: 'Conversion created at.',
    example: new Date(),
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ')
  created_at?: Date;

  constructor(props: GetAllConversionResponseItem) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.quotation_id = props.quotationId;
    this.price =
      props.side === OrderSide.BUY ? props.priceBuy : props.priceSell;
    this.side = props.side;
    this.quote_amount =
      props.side === OrderSide.BUY
        ? props.quoteAmountBuy
        : props.quoteAmountSell;
    this.quote_currency_symbol = props.quoteCurrencySymbol;
    this.quote_currency_decimal = props.quoteCurrencyDecimal;
    this.quote_currency_title = props.quoteCurrencyTitle;
    this.base_amount =
      props.side === OrderSide.BUY ? props.baseAmountBuy : props.baseAmountSell;
    this.base_currency_symbol = props.baseCurrencySymbol;
    this.base_currency_decimal = props.baseCurrencyDecimal;
    this.base_currency_title = props.baseCurrencyTitle;
    this.created_at = props.createdAt;
  }
}

class V3GetAllConversionRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Conversion data.',
    type: [V3GetAllConversionRestResponseItem],
  })
  data!: V3GetAllConversionRestResponseItem[];

  constructor(props: GetAllConversionResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new V3GetAllConversionRestResponseItem(item),
    );
  }
}

/**
 * Otc controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('otc/conversions')
@HasPermission('api-paas-get-otc-conversions')
export class V3GetAllConversionRestController {
  /**
   * get conversions endpoint.
   */
  @ApiOperation({
    summary: "List user's conversions.",
    description:
      "Get a list of user's conversions. You can include any of the filter parameters below to refine your search.",
  })
  @ApiOkResponse({
    description: 'The conversions returned successfully.',
    type: V3GetAllConversionRestResponse,
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
  @Version('3')
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Query() query: V3GetAllConversionParams,
    @KafkaServiceParam(GetAllConversionServiceKafka)
    getAllConversionService: GetAllConversionServiceKafka,
    @LoggerParam(V3GetAllConversionRestController)
    logger: Logger,
  ): Promise<V3GetAllConversionRestResponse> {
    // GetAll payload.
    const payload: GetAllConversionRequest = {
      // Conversion query
      userId: user.uuid,
      operationId: query.operation_id,
      currencySymbol: query.currency_symbol,
      quotationId: query.quotation_id,
      conversionType: query.conversion_type,
      createdAtStart: query.created_at_start,
      createdAtEnd: query.created_at_end,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('Get All conversions.', { user, payload });

    // Call get all conversion service.
    const result = await getAllConversionService.execute(payload);

    logger.debug('Conversions found.', { result });

    const response = new V3GetAllConversionRestResponse(result);

    return response;
  }
}
