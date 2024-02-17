import { Logger } from 'winston';
import { Transform } from 'class-transformer';
import { Controller, Get, Query } from '@nestjs/common';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  IsBiggestThan,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  IsSmallerThan,
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { AuthAdmin } from '@zro/api-admin/domain';
import {
  BotOtc,
  BotOtcOrderRequestSort,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';
import {
  CryptoMarket,
  CryptoOrder,
  CryptoRemittanceStatus,
  OrderType,
  Provider,
  Remittance,
} from '@zro/otc/domain';
import {
  GetAllBotOtcOrdersByFilterRequest,
  GetAllBotOtcOrdersByFilterResponse,
  GetAllBotOtcOrdersByFilterResponseItem,
} from '@zro/otc-bot/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetAllBotOtcOrdersByFilterServiceKafka } from '@zro/otc-bot/infrastructure';

class GetAllBotOtcOrderByFilterParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: BotOtcOrderRequestSort,
  })
  @IsOptional()
  @Sort(BotOtcOrderRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Bot otc order state.',
    enum: BotOtcOrderState,
  })
  @IsOptional()
  @IsEnum(BotOtcOrderState)
  state?: BotOtcOrderState;

  @ApiPropertyOptional({
    description: 'Base currency symbol.',
  })
  @IsOptional()
  @IsString()
  base_currency_symbol?: string;

  @ApiPropertyOptional({
    description: 'Quote currency symbol.',
  })
  @IsOptional()
  @IsString()
  quote_currency_symbol?: string;

  @ApiPropertyOptional({
    description: 'Amount range start.',
  })
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsOptional()
  @IsSmallerThan('amount_end', true, {
    message: 'amount_start must be smaller than amount_end',
  })
  amount_start?: number;

  @ApiPropertyOptional({
    description: 'Amount range end.',
  })
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsOptional()
  @IsBiggestThan('amount_start', true, {
    message: 'amount_end must be greater than amount_start',
  })
  amount_end?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order type.',
    enum: OrderType,
  })
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @ApiPropertyOptional({
    description: 'Bot otc order sell status.',
    enum: CryptoRemittanceStatus,
  })
  @IsOptional()
  @IsEnum(CryptoRemittanceStatus)
  sell_status?: CryptoRemittanceStatus;

  @ApiPropertyOptional({
    description: 'Sell provider name.',
  })
  @IsOptional()
  @IsString()
  sell_provider_name?: string;

  @ApiPropertyOptional({
    description: 'Sell executed price range start.',
  })
  @IsOptional()
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsSmallerThan('sell_executed_price_end', true, {
    message:
      'sell_executed_price_start must be smaller than sell_executed_price_end',
  })
  sell_executed_price_start?: number;

  @ApiPropertyOptional({
    description: 'Sell executed price range end.',
  })
  @IsOptional()
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsBiggestThan('sell_executed_price_start', true, {
    message:
      'sell_executed_price_end must be greater than sell_executed_price_start',
  })
  sell_executed_price_end?: number;

  @ApiPropertyOptional({
    description: 'Sell executed amount range start.',
  })
  @IsOptional()
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsSmallerThan('sell_executed_amount_end', true, {
    message:
      'sell_executed_amount_start must be smaller than sell_executed_amount_end',
  })
  sell_executed_amount_start?: number;

  @ApiPropertyOptional({
    description: 'Sell executed amount range end.',
  })
  @IsOptional()
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsBiggestThan('sell_executed_amount_start', true, {
    message:
      'sell_executed_amount_end must be greater than sell_executed_amount_start',
  })
  sell_executed_amount_end?: number;

  @ApiPropertyOptional({
    description: 'Buy provider name.',
  })
  @IsOptional()
  @IsString()
  buy_provider_name?: string;

  @ApiPropertyOptional({
    description: 'Buy executed price range start.',
  })
  @IsOptional()
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsSmallerThan('buy_executed_price_end', true, {
    message:
      'buy_executed_price_start must be smaller than buy_executed_price_end',
  })
  buy_executed_price_start?: number;

  @ApiPropertyOptional({
    description: 'Buy executed price range end.',
  })
  @IsOptional()
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsBiggestThan('buy_executed_price_start', true, {
    message:
      'buy_executed_price_end must be greater than buy_executed_price_start',
  })
  buy_executed_price_end?: number;

  @ApiPropertyOptional({
    description: 'Buy executed amout range start.',
  })
  @IsOptional()
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsSmallerThan('buy_executed_amount_end', true, {
    message:
      'buy_executed_amount_start must be smaller than buy_executed_amount_end',
  })
  buy_executed_amount_start?: number;

  @ApiPropertyOptional({
    description: 'Buy executed amount range end.',
  })
  @IsOptional()
  @Transform((query) => parseInt(query.value))
  @IsInt()
  @IsPositive()
  @IsBiggestThan('buy_executed_amount_start', true, {
    message:
      'buy_executed_amount_end must be greater than buy_executed_amount_start',
  })
  buy_executed_amount_end?: number;

  @ApiPropertyOptional({
    description: 'created_at date range start.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_start',
  })
  @IsDateBeforeThan('created_at_end', false, {
    message: 'created_at_start must be before than created_at_end',
  })
  created_at_start?: Date;

  @ApiPropertyOptional({
    description: 'created_at date range end.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created_at_end',
  })
  @IsDateAfterThan('created_at_start', false, {
    message: 'created_at_end must be after than created_at_start',
  })
  created_at_end?: Date;

  @ApiPropertyOptional({
    description: 'updated_at date range start.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated_at_start',
  })
  @IsDateBeforeThan('updated_at_end', false, {
    message: 'updated_at_start must be before than updated_at_end',
  })
  updated_at_start?: Date;

  @ApiPropertyOptional({
    description: 'updated_at date range end.',
    format: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updated_at_end',
  })
  @IsDateAfterThan('updated_at_start', false, {
    message: 'updated_at_end must be after than updated_at_start',
  })
  updated_at_end?: Date;

  @ApiPropertyOptional({
    description: 'Remittance id',
  })
  @IsOptional()
  @IsUUID(4)
  remittance_id?: string;
}

class GetAllBotOtcOrdersByFilterRestResponseItem {
  @ApiProperty({
    description: 'Bot otc order id',
    example: '4c0b45bf-1ab9-41b8-9ca1-db3ed1cb5bb0',
  })
  id: string;

  @ApiProperty({
    description: 'Bot otc.',
  })
  bot_otc: BotOtc;

  @ApiProperty({
    enum: BotOtcOrderState,
    description: 'Bot otc order state.',
  })
  state: BotOtcOrderState;

  @ApiProperty({
    description: 'Bot otc order base currency.',
  })
  base_currency: Currency;

  @ApiProperty({
    description: 'Bot otc order quote currency.',
  })
  quote_currency: Currency;

  @ApiProperty({
    description: 'Bot otc order crypto market.',
  })
  market: CryptoMarket;

  @ApiProperty({
    description: 'Bot otc order amount.',
    example: 10000000,
  })
  amount: number;

  @ApiProperty({
    enum: OrderType,
    description: 'Bot otc order type.',
  })
  type: OrderType;

  @ApiProperty({
    enum: CryptoRemittanceStatus,
    description: 'Bot otc order sell status.',
  })
  sell_status: CryptoRemittanceStatus;

  @ApiProperty({
    description: 'Bot otc order sell price.',
    example: 8477500000000,
  })
  sell_price: number;

  @ApiPropertyOptional({
    description: 'Bot otc order sell stop price.',
    example: 123546,
  })
  sell_stop_price?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order sell valid until date.',
    example: new Date(),
  })
  sell_valid_until?: Date;

  @ApiProperty({
    description: 'Bot otc order sell provider.',
  })
  sell_provider: Provider;

  @ApiProperty({
    description: 'Bot otc order sell provider order id.',
    example: '4c0b45bf-1ab9-41b8-9ca1-db3ed1cb5bb0',
  })
  sell_provider_order_id: string;

  @ApiProperty({
    description: 'Bot otc order sell provider name.',
    example: 'B2C2',
  })
  sell_provider_name: string;

  @ApiPropertyOptional({
    description: 'Bot otc order sell executed price.',
    example: 14985000000000,
  })
  sell_executed_price?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order sell executed amount.',
    example: 10000000,
  })
  sell_executed_amount?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order sell fee.',
  })
  sell_fee?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order buy provider.',
  })
  buy_provider?: Provider;

  @ApiPropertyOptional({
    description: 'Bot otc order buy provider order id.',
    example: '4c0b45bf-1ab9-41b8-9ca1-db3ed1cb5bb0',
  })
  buy_provider_order_id?: string;

  @ApiPropertyOptional({
    description: 'Bot otc order buy provider name.',
    example: 'B2C2',
  })
  buy_provider_name?: string;

  @ApiPropertyOptional({
    description: 'Bot otc order buy executed price.',
    example: 2921089318,
  })
  buy_executed_price?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order buy executed amount.',
    example: 30000000,
  })
  buy_executed_amount?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order buy price signficant digits.',
    example: 5,
  })
  buy_price_significant_digits?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order buy fee.',
  })
  buy_fee?: number;

  @ApiPropertyOptional({
    description: 'Bot otc order sell order.',
  })
  sell_order?: CryptoOrder;

  @ApiPropertyOptional({
    description: 'Bot otc order buy order.',
  })
  buy_order?: CryptoOrder;

  @ApiPropertyOptional({
    description: 'Bot otc order failed code.',
  })
  failed_code?: string;

  @ApiPropertyOptional({
    description: 'Bot otc order failed message.',
  })
  failed_message?: string;

  @ApiPropertyOptional({
    description: 'Bot otc order buy remittance id.',
    example: '4c0b45bf-1ab9-41b8-9ca1-db3ed1cb5bb0',
  })
  buy_remittance_id?: Remittance['id'];

  @ApiPropertyOptional({
    description: 'Bot otc order buy remittance bank quote.',
    example: 52800,
  })
  buy_bank_quote?: Remittance['bankQuote'];

  @ApiProperty({
    description: 'Bot otc order created_at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Bot otc order updated_at.',
    example: new Date(),
  })
  updated_at: Date;

  constructor(props: GetAllBotOtcOrdersByFilterResponseItem) {
    this.id = props.id;
    this.bot_otc = props.botOtc;
    this.state = props.state;
    this.base_currency = props.baseCurrency;
    this.quote_currency = props.quoteCurrency;
    this.market = props.market;
    this.amount = props.amount;
    this.type = props.type;
    this.sell_status = props.sellStatus;
    this.sell_price = props.sellPrice;
    this.sell_stop_price = props.sellStopPrice;
    this.sell_valid_until = props.sellValidUntil;
    this.sell_provider = props.sellProvider;
    this.sell_provider_order_id = props.sellProviderOrderId;
    this.sell_provider_name = props.sellProviderName;
    this.sell_executed_price = props.sellExecutedPrice;
    this.sell_executed_amount = props.sellExecutedAmount;
    this.sell_fee = props.sellFee;
    this.buy_provider = props.buyProvider;
    this.buy_provider_order_id = props.buyProviderOrderId;
    this.buy_provider_name = props.buyProviderName;
    this.buy_executed_price = props.buyExecutedPrice;
    this.buy_executed_amount = props.buyExecutedAmount;
    this.buy_price_significant_digits = props.buyPriceSignificantDigits;
    this.buy_fee = props.buyFee;
    this.sell_order = props.sellOrder;
    this.buy_order = props.buyOrder;
    this.failed_code = props.failedCode;
    this.failed_message = props.failedMessage;
    this.buy_remittance_id = props.buyRemittanceId;
    this.buy_bank_quote = props.buyBankQuote;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

class GetAllBotOtcOrdersByFilterRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Bot otc order data.',
    type: [GetAllBotOtcOrdersByFilterRestResponseItem],
  })
  data!: GetAllBotOtcOrdersByFilterRestResponseItem[];

  constructor(props: GetAllBotOtcOrdersByFilterResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllBotOtcOrdersByFilterRestResponseItem(item),
    );
  }
}

/**
 * Get all remittance orders by filter controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Otc Bot')
@ApiBearerAuth()
@Controller('otc-bot/orders')
export class GetAllBotOtcOrdersByFilterRestController {
  /**
   * Get all remittance orders by filter endpoint.
   */
  @ApiOperation({
    summary: 'Get all bot otc orders by filter.',
    description: 'List all existent bot otc orders filtered.',
  })
  @ApiOkResponse({
    description: 'Bot otc orders have been successfully returned.',
    type: GetAllBotOtcOrdersByFilterRestResponse,
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
    @Query() params: GetAllBotOtcOrderByFilterParams,
    @KafkaServiceParam(GetAllBotOtcOrdersByFilterServiceKafka)
    service: GetAllBotOtcOrdersByFilterServiceKafka,
    @LoggerParam(GetAllBotOtcOrdersByFilterRestController)
    logger: Logger,
  ): Promise<GetAllBotOtcOrdersByFilterRestResponse> {
    // Create a payload.
    const payload: GetAllBotOtcOrdersByFilterRequest = {
      state: params.state,
      baseCurrencySymbol: params.base_currency_symbol,
      quoteCurrencySymbol: params.quote_currency_symbol,
      amountStart: params.amount_start,
      amountEnd: params.amount_end,
      type: params.type,
      sellStatus: params.sell_status,
      sellProviderName: params.sell_provider_name,
      sellExecutedPriceStart: params.sell_executed_price_start,
      sellExecutedPriceEnd: params.sell_executed_price_end,
      sellExecutedAmountStart: params.sell_executed_amount_start,
      sellExecutedAmountEnd: params.sell_executed_amount_end,
      buyProviderName: params.buy_provider_name,
      buyExecutedPriceStart: params.buy_executed_price_start,
      buyExecutedPriceEnd: params.buy_executed_price_end,
      buyExecutedAmountStart: params.buy_executed_amount_start,
      buyExecutedAmountEnd: params.buy_executed_amount_end,
      createdAtStart: params.created_at_start,
      createdAtEnd: params.created_at_end,
      updatedAtStart: params.updated_at_start,
      updatedAtEnd: params.updated_at_end,
      remittanceId: params.remittance_id,
    };

    logger.debug('Get all bot otc orders by filter.', { admin, payload });

    // Call get all bot otc orders by filter service.
    const result = await service.execute(payload);

    logger.debug('Bot otc orders found.', { result });

    const response = new GetAllBotOtcOrdersByFilterRestResponse(result);

    return response;
  }
}
