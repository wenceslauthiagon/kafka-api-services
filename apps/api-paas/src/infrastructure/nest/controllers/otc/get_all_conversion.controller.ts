import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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
  isCpf,
  cpfMask,
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

class GetAllConversionParams extends PaginationParams {
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
  @MaxLength(255)
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
    description: 'Conversion client name.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_name?: string;

  @ApiPropertyOptional({
    description: 'Conversion client document.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_document?: string;

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

class GetAllConversionRestResponseItem {
  @ApiProperty({
    description: 'Conversion UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Operation UUID. Used to track the conversion.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiPropertyOptional({
    description:
      'Quotation UUID. Used to track the quotation for this conversion.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  quotation_id?: string;

  @ApiPropertyOptional({
    description: 'Currency ID. Used to track the currency for this conversion.',
    example: 2,
  })
  currency_id?: number;

  @ApiPropertyOptional({
    description: 'Currency Title.',
    example: 'Bitcoin',
  })
  currency_title?: string;

  @ApiPropertyOptional({
    description: 'Currency Symbol.',
    example: 'BTC',
  })
  currency_symbol?: string;

  @ApiPropertyOptional({
    description: 'Currency Decimal',
    example: 8,
  })
  currency_decimal?: number;

  @ApiProperty({
    description: 'Conversion type.',
    example: OrderSide.BUY,
    enum: OrderSide,
  })
  conversion_type: OrderSide;

  @ApiPropertyOptional({
    description: 'Client name for conversion.',
    example: 'Name Test',
  })
  client_name?: string;

  @ApiPropertyOptional({
    description: 'Client document for conversion.',
    example: '***66848000***',
  })
  client_document?: string;

  @ApiPropertyOptional({
    description:
      'Crypto Amount (sell or buy) for conversion. Without decimal houses.',
    example: 100000,
  })
  amount?: number;

  @ApiPropertyOptional({
    description: 'Crypto Quote (sell or buy) for conversion.',
    example: '0.99931',
  })
  quote?: string;

  @ApiPropertyOptional({
    description: 'Conversion created at.',
    example: new Date(),
  })
  created_at?: Date;

  constructor(props: GetAllConversionResponseItem) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.quotation_id = props.quotationId;
    this.currency_id = props.currencyId;
    this.currency_title = props.currencyTitle;
    this.currency_symbol = props.currencySymbol;
    this.currency_decimal = props.currencyDecimal;
    this.conversion_type = props.side;
    this.client_name = props.clientName;
    this.client_document = isCpf(props.clientDocument)
      ? cpfMask(props.clientDocument)
      : props.clientDocument;
    this.amount = props.amount;
    this.quote = props.quote;
    this.created_at = props.createdAt;
  }
}

class GetAllConversionRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Conversions data.',
    type: [GetAllConversionRestResponseItem],
  })
  data!: GetAllConversionRestResponseItem[];

  constructor(props: GetAllConversionResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllConversionRestResponseItem(item),
    );
  }
}

/**
 * Otc controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('conversions')
@HasPermission('api-paas-get-otc-conversions')
export class GetAllConversionRestController {
  /**
   * get conversions endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: "List user's conversions.",
    description: "Get a list of user's conversions.",
  })
  @ApiOkResponse({
    description: 'The conversions returned successfully.',
    type: GetAllConversionRestResponse,
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
    @Query() query: GetAllConversionParams,
    @KafkaServiceParam(GetAllConversionServiceKafka)
    getAllConversionService: GetAllConversionServiceKafka,
    @LoggerParam(GetAllConversionRestController)
    logger: Logger,
  ): Promise<GetAllConversionRestResponse> {
    // GetAll payload.
    const payload: GetAllConversionRequest = {
      // Conversion query
      userId: user.uuid,
      operationId: query.operation_id,
      currencySymbol: query.currency_symbol,
      quotationId: query.quotation_id,
      conversionType: query.conversion_type,
      clientName: query.client_name,
      clientDocument: query.client_document,
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

    const response = new GetAllConversionRestResponse(result);

    return response;
  }
}
