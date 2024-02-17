import { Controller, Logger, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
} from 'class-validator';
import {
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import {
  QuotationTrendWindow,
  QuotationTrendResolution,
} from '@zro/quotations/domain';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesResponseItem,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint,
} from '@zro/quotations/interface';
import { GetTrendsByWindowAndResolutionAndBaseCurrenciesServiceKafka } from '@zro/quotations/infrastructure';

export class GetTrendsByWindowAndResolutionAndBaseCurrenciesParams {
  @ApiProperty({
    description: 'Quotation trend window.',
    enum: QuotationTrendWindow,
    example: QuotationTrendWindow['QTW_1d'],
  })
  @IsEnum(QuotationTrendWindow)
  window!: QuotationTrendWindow;

  @ApiProperty({
    description: 'Quotation trend resolution.',
    enum: QuotationTrendResolution,
    example: QuotationTrendResolution['QTR_10m'],
  })
  @IsEnum(QuotationTrendResolution)
  resolution!: QuotationTrendResolution;

  @ApiProperty({
    description: 'Quotation currency symbol.',
    example: ['BTC'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Length(1, 255, { each: true })
  @Transform((params) =>
    Array.isArray(params.value) ? params.value : [params.value],
  )
  base_currencies!: string[];
}

class GetTrendsByWindowAndResolutionAndBaseCurrenciesRestResponsePoint {
  @ApiProperty({
    description: 'Quotation trend price in cents.',
    example: 414661,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  price: number;

  @ApiProperty({
    description: 'Quotation trend price buy in cents.',
    example: 414661,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  price_buy: number;

  @ApiProperty({
    description: 'Quotation trend price sell in cents.',
    example: 414661,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  price_sell: number;

  @ApiProperty({
    description: 'Quotation trend timestamp.',
    example: new Date(),
  })
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format timestamp',
  })
  timestamp: Date;

  constructor(
    props: GetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint,
  ) {
    this.price = props.price;
    this.price_buy = props.buy;
    this.price_sell = props.sell;
    this.timestamp = props.timestamp;
  }
}

export class GetTrendsByWindowAndResolutionAndBaseCurrenciesRestResponse {
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
    example: 'Bitcoin',
  })
  @IsString()
  base_currency_title: string;

  @ApiProperty({
    description: 'Quotation trends points.',
    type: [GetTrendsByWindowAndResolutionAndBaseCurrenciesRestResponsePoint],
  })
  points: GetTrendsByWindowAndResolutionAndBaseCurrenciesRestResponsePoint[];

  constructor(
    props: GetTrendsByWindowAndResolutionAndBaseCurrenciesResponseItem,
  ) {
    this.quote_currency_symbol = props.quoteCurrencySymbol;
    this.quote_currency_decimal = props.quoteCurrencyDecimal;
    this.quote_currency_title = props.quoteCurrencyTitle;
    this.base_currency_symbol = props.baseCurrencySymbol;
    this.base_currency_decimal = props.baseCurrencyDecimal;
    this.base_currency_title = props.baseCurrencyTitle;
    this.points = props.points.map(
      (item) =>
        new GetTrendsByWindowAndResolutionAndBaseCurrenciesRestResponsePoint(
          item,
        ),
    );
  }
}

/**
 * Get quotation trends controller.
 */
@ApiTags('Quotations | Conversions')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('quotations/trends')
@HasPermission('api-users-get-quotations-trends')
export class GetTrendsByWindowAndResolutionAndBaseCurrenciesRestController {
  /**
   * Get quotation trends endpoint.
   */
  @ApiOperation({
    summary: 'Get quotation trends.',
    description: 'Get quotation trends by base currency.',
  })
  @ApiOkResponse({
    description: 'Quotation trends returned successfully.',
    type: [GetTrendsByWindowAndResolutionAndBaseCurrenciesRestResponse],
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(
      GetTrendsByWindowAndResolutionAndBaseCurrenciesServiceKafka,
    )
    service: GetTrendsByWindowAndResolutionAndBaseCurrenciesServiceKafka,
    @LoggerParam(GetTrendsByWindowAndResolutionAndBaseCurrenciesRestController)
    logger: Logger,
    @Query() params: GetTrendsByWindowAndResolutionAndBaseCurrenciesParams,
  ): Promise<GetTrendsByWindowAndResolutionAndBaseCurrenciesRestResponse[]> {
    // Create a payload.
    const payload: GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest = {
      window: params.window,
      resolution: params.resolution,
      baseCurrencySymbols: params.base_currencies,
    };

    logger.debug('Get quotation trends payload.', { user, payload });

    // Call get quotation trends service.
    const result = await service.execute(payload);

    logger.debug('Got quotation trends result.', { result });

    const response = result.map(
      (item) =>
        new GetTrendsByWindowAndResolutionAndBaseCurrenciesRestResponse(item),
    );

    return response;
  }
}
