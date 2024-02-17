import { Transform } from 'class-transformer';
import { Controller, Logger, Get, Query, Version } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
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
import { NotLoadAuthWallet } from '@zro/operations/infrastructure';
import { GetQuotationServiceKafka } from '@zro/quotations/infrastructure';
import {
  GetQuotationRequest,
  GetQuotationResponse,
} from '@zro/quotations/interface';

class V2GetQuotationParams {
  @ApiProperty({
    description: 'Quotation currency.',
    example: 'BTC',
  })
  @IsString()
  base_currency!: string;

  @ApiProperty({
    description: 'Quotation currency quote.',
    example: 'BRL',
  })
  @IsString()
  amount_currency!: string;

  @ApiProperty({
    description: 'Quotation amount in cents.',
    example: '1',
  })
  @Transform((body) => parseInt(body.value))
  @IsInt()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    enum: OrderSide,
    description: 'Quotation side.',
    example: OrderSide.BUY,
  })
  @IsEnum(OrderSide)
  side!: OrderSide;
}

class V2GetQuotationRestResponse {
  @ApiProperty({
    description: 'Quotation ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id: string;

  @ApiProperty({
    description: 'Quotation price buy in cents.',
  })
  @IsInt()
  @IsPositive()
  price_buy: number;

  @ApiProperty({
    description: 'Quotation price sell in cents.',
  })
  @IsInt()
  @IsPositive()
  price_sell: number;

  @ApiProperty({
    enum: OrderSide,
    description: 'Quotation side.',
    example: OrderSide.BUY,
  })
  @IsEnum(OrderSide)
  side: OrderSide;

  @ApiProperty({
    description: 'Quotation quote amount buy.',
  })
  @IsInt()
  @IsPositive()
  quote_amount_buy: number;

  @ApiProperty({
    description: 'Quotation quote amount sell.',
  })
  @IsInt()
  @IsPositive()
  quote_amount_sell: number;

  @ApiProperty({
    description: 'Quotation quote currency symbol.',
    example: 'BRL',
  })
  @IsString()
  quote_currency_symbol: string;

  @ApiProperty({
    description: 'Quotation quote currency decimal.',
    example: '2',
  })
  @IsInt()
  @Min(0)
  quote_currency_decimal: number;

  @ApiProperty({
    description: 'Quotation quote currency title.',
    example: 'Real',
  })
  @IsString()
  quote_currency_title: string;

  @ApiProperty({
    description: 'Quotation base amount buy.',
  })
  @IsInt()
  @IsPositive()
  base_amount_buy: number;

  @ApiProperty({
    description: 'Quotation base amount sell.',
  })
  @IsInt()
  @IsPositive()
  base_amount_sell: number;

  @ApiProperty({
    description: 'Quotation base currency symbol.',
    example: 'BTC',
  })
  @IsString()
  base_currency_symbol: string;

  @ApiProperty({
    description: 'Quotation base currency decimal.',
    example: '8',
  })
  @IsInt()
  @Min(0)
  base_currency_decimal: number;

  @ApiProperty({
    description: 'Quotation base currency title.',
    example: 'Real',
  })
  @IsString()
  base_currency_title: string;

  @ApiProperty({
    description: 'Quotation TTL date.',
    example: new Date(),
  })
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ')
  ttl: Date;

  constructor(props: GetQuotationResponse) {
    this.id = props.id;
    this.price_buy = props.priceBuy;
    this.price_sell = props.priceSell;
    this.side = props.side;
    this.quote_amount_buy = props.quoteAmountBuy;
    this.quote_amount_sell = props.quoteAmountSell;
    this.quote_currency_symbol = props.quoteCurrencySymbol;
    this.quote_currency_decimal = props.quoteCurrencyDecimal;
    this.quote_currency_title = props.quoteCurrencyTitle;
    this.base_amount_buy = props.baseAmountBuy;
    this.base_amount_sell = props.baseAmountSell;
    this.base_currency_symbol = props.baseCurrencySymbol;
    this.base_currency_decimal = props.baseCurrencyDecimal;
    this.base_currency_title = props.baseCurrencyTitle;
    this.ttl = props.ttl;
  }
}

/**
 * Get quotation controller.
 */
@ApiTags('Quotations | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('quotations/spot')
@HasPermission('api-paas-get-quotations-spot')
export class V2GetQuotationRestController {
  /**
   * Get spot quotation endpoint.
   */
  @ApiOperation({
    summary: 'Get new SPOT quotation.',
    description:
      'To create a new currency conversion, first you need to create a Quotation ID. Enter a new SPOT quotation below and execute to get its ID. This ID is the quotation_id which will be required to create a new currency conversion.',
  })
  @ApiOkResponse({
    description: 'Quotation returned successfully.',
    type: V2GetQuotationRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Version('2')
  @Get()
  @NotLoadAuthWallet()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(GetQuotationServiceKafka)
    service: GetQuotationServiceKafka,
    @LoggerParam(V2GetQuotationRestController)
    logger: Logger,
    @Query() params: V2GetQuotationParams,
  ): Promise<V2GetQuotationRestResponse> {
    // Create a payload.
    const payload: GetQuotationRequest = {
      amount: params.amount,
      amountCurrencySymbol: params.amount_currency,
      baseCurrencySymbol: params.base_currency,
      side: params.side,
      userId: user.uuid,
    };

    logger.debug('Get quotation payload.', { user, payload });

    // Call get quotation service.
    const result = await service.execute(payload);

    logger.debug('Got quotation result.', { result });

    const response = result && new V2GetQuotationRestResponse(result);

    return response;
  }
}
