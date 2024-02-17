import { Controller, Get, Param } from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
  ApiPropertyOptional,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  DefaultApiHeaders,
  HasPermission,
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { OrderSide } from '@zro/otc/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetConversionByUserAndIdServiceKafka } from '@zro/otc/infrastructure';
import {
  GetConversionByUserAndIdResponse,
  GetConversionByUserAndIdRequest,
} from '@zro/otc/interface';

class GetConversionByIdParams {
  @ApiProperty({
    description: 'Conversion UUID.',
  })
  @IsUUID(4)
  id!: string;
}

class GetConversionByIdRestResponse {
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

  constructor(props: GetConversionByUserAndIdResponse) {
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

/**
 * User otc controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('otc/conversions/:id')
@HasPermission('api-paas-get-otc-conversions-by-id')
export class GetConversionByIdRestController {
  /**
   * Get conversion endpoint.
   */
  @ApiOperation({
    summary: 'Get conversion by ID.',
    description:
      "Enter the conversion's ID below and execute to get all its information.",
  })
  @ApiOkResponse({
    description: 'Conversion returned successfully.',
    type: GetConversionByIdRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: GetConversionByIdParams,
    @KafkaServiceParam(GetConversionByUserAndIdServiceKafka)
    service: GetConversionByUserAndIdServiceKafka,
    @LoggerParam(GetConversionByIdRestController)
    logger: Logger,
  ): Promise<GetConversionByIdRestResponse> {
    // Create a payload.
    const payload: GetConversionByUserAndIdRequest = {
      id: params.id,
      userId: user.uuid,
    };

    logger.debug('Get conversion by id.', { user, payload });

    // Call send get conversion by id service.
    const result = await service.execute(payload);

    logger.debug('Conversion found.', { result });

    const response = result && new GetConversionByIdRestResponse(result);

    return response;
  }
}
