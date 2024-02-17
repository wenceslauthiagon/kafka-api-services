import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
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
import { AuthAdmin } from '@zro/api-admin/domain';
import { Currency } from '@zro/operations/domain';
import { BotOtcOrderState, BotOtc } from '@zro/otc-bot/domain';
import {
  CryptoMarket,
  CryptoRemittanceStatus,
  OrderType,
  Remittance,
  Provider,
  CryptoOrder,
} from '@zro/otc/domain';
import { IsUUID } from 'class-validator';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import {
  GetBotOtcOrderByIdRequest,
  GetBotOtcOrderByIdResponse,
} from '@zro/otc-bot/interface';
import { GetBotOtcOrderByIdServiceKafka } from '@zro/otc-bot/infrastructure';

class GetBotOtcOrderByIdRestParams {
  @ApiProperty({
    description: 'Bot Otc Order ID.',
  })
  @IsUUID(4)
  id: string;
}

class GetBotOtcOrderByIdRestResponse {
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
    description: 'Bot otc order buy price significant digits.',
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

  constructor(props: GetBotOtcOrderByIdResponse) {
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

/**
 * Get bot otc order by id controller. Controller is protected by JWT access token.
 */
@ApiTags('Otc Bot')
@ApiBearerAuth()
@Controller('otc-bot/orders/:id')
export class GetBotOtcOrderByIdRestController {
  /**
   * get bot otc order by id endpoint.
   */
  @ApiOperation({
    summary: 'Get Bot Otc Order by id.',
    description: 'Get Bot Otc Order by id.',
  })
  @ApiOkResponse({
    description: 'Bot otc order returned successfully.',
    type: GetBotOtcOrderByIdRestResponse,
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
    @Param() params: GetBotOtcOrderByIdRestParams,
    @KafkaServiceParam(GetBotOtcOrderByIdServiceKafka)
    service: GetBotOtcOrderByIdServiceKafka,
    @LoggerParam(GetBotOtcOrderByIdRestController)
    logger: Logger,
  ): Promise<GetBotOtcOrderByIdRestResponse> {
    // Create a payload.
    const payload: GetBotOtcOrderByIdRequest = {
      id: params.id,
    };

    logger.debug('Get bot otc order by id.', { admin, payload });

    // Call get bot otc order by id service.
    const result = await service.execute(payload);

    logger.debug('Bot otc order found.', { result });

    const response = result && new GetBotOtcOrderByIdRestResponse(result);

    return response;
  }
}
