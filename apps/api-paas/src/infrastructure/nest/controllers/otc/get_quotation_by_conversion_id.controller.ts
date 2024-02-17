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
import { GetQuotationByConversionIdAndUserServiceKafka } from '@zro/otc/infrastructure';
import {
  GetQuotationByConversionIdAndUserResponse,
  GetQuotationByConversionIdAndUserRequest,
} from '@zro/otc/interface';

class GetQuotationByConversionIdParams {
  @ApiProperty({
    description: 'Conversion UUID.',
  })
  @IsUUID(4)
  id!: string;
}

class GetQuotationByConversionIdRestResponse {
  @ApiProperty({
    description: 'Quotation ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id: string;

  @ApiProperty({
    description: 'Quotation price buy.',
  })
  @IsInt()
  @IsPositive()
  price_buy: number;

  @ApiProperty({
    description: 'Quotation price sell.',
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
  @IsOptional()
  quote_currency_symbol?: string;

  @ApiProperty({
    description: 'Quotation quote currency decimal.',
    example: '2',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  quote_currency_decimal?: number;

  @ApiProperty({
    description: 'Quotation quote currency title.',
    example: 'Real',
  })
  @IsString()
  @IsOptional()
  quote_currency_title?: string;

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
  @IsOptional()
  base_currency_symbol?: string;

  @ApiProperty({
    description: 'Quotation base currency decimal.',
    example: '8',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  base_currency_decimal?: number;

  @ApiProperty({
    description: 'Quotation base currency title.',
    example: 'Real',
  })
  @IsString()
  @IsOptional()
  base_currency_title?: string;

  @ApiPropertyOptional({
    description: 'Quotation created at.',
    example: new Date(),
  })
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ')
  created_at: Date;

  constructor(props: GetQuotationByConversionIdAndUserResponse) {
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
    this.created_at = props.createdAt;
  }
}

/**
 * User otc controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('otc/conversions/:id/quotations')
@HasPermission('api-paas-get-otc-conversions-quotations-by-id')
export class GetQuotationByConversionIdRestController {
  /**
   * Get conversion's quotation endpoint.
   */
  @ApiOperation({
    summary: 'Get quotation by Conversion ID.',
    description:
      "Enter the conversion's ID below and execute to get its related quotation.",
  })
  @ApiOkResponse({
    description: 'Quotation returned successfully.',
    type: GetQuotationByConversionIdRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: GetQuotationByConversionIdParams,
    @KafkaServiceParam(GetQuotationByConversionIdAndUserServiceKafka)
    service: GetQuotationByConversionIdAndUserServiceKafka,
    @LoggerParam(GetQuotationByConversionIdRestController)
    logger: Logger,
  ): Promise<GetQuotationByConversionIdRestResponse> {
    // Create a payload.
    const payload: GetQuotationByConversionIdAndUserRequest = {
      id: params.id,
      userId: user.uuid,
    };

    logger.debug('Get Quotation by conversion id.', { user, payload });

    // Call send get Quotation by conversion id service.
    const result = await service.execute(payload);

    logger.debug('Quotation found.', { result });

    const response =
      result && new GetQuotationByConversionIdRestResponse(result);

    return response;
  }
}
