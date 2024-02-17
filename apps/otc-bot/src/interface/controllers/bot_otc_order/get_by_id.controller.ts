import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  BotOtc,
  BotOtcOrder,
  BotOtcOrderRepository,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';
import {
  CryptoMarket,
  CryptoOrder,
  CryptoRemittanceStatus,
  OrderType,
  Remittance,
  Provider,
} from '@zro/otc/domain';
import { GetBotOtcOrderByIdUseCase as UseCase } from '@zro/otc-bot/application';

type TGetBotOtcOrderByIdRequest = Pick<BotOtcOrder, 'id'>;

export class GetBotOtcOrderByIdRequest
  extends AutoValidator
  implements TGetBotOtcOrderByIdRequest
{
  @IsUUID(4)
  id: BotOtcOrder['id'];

  constructor(props: TGetBotOtcOrderByIdRequest) {
    super(props);
  }
}

type TGetBotOtcOrderByIdResponse = BotOtcOrder & {
  buyRemittanceId?: Remittance['id'];
  buyBankQuote?: Remittance['bankQuote'];
};

export class GetBotOtcOrderByIdResponse
  extends AutoValidator
  implements TGetBotOtcOrderByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsObject()
  botOtc: BotOtc;

  @IsEnum(BotOtcOrderState)
  state: BotOtcOrderState;

  @IsObject()
  baseCurrency: Currency;

  @IsObject()
  quoteCurrency: Currency;

  @IsObject()
  market: CryptoMarket;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsEnum(OrderType)
  type: OrderType;

  @IsEnum(CryptoRemittanceStatus)
  sellStatus: CryptoRemittanceStatus;

  @IsInt()
  @IsPositive()
  sellPrice: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  sellStopPrice?: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format date sellValidUntil',
  })
  @IsOptional()
  sellValidUntil?: Date;

  @IsOptional()
  @IsObject()
  sellProvider: Provider;

  @IsOptional()
  @IsString()
  sellProviderOrderId: string;

  @IsOptional()
  @IsString()
  sellProviderName: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  sellExecutedPrice?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  sellExecutedAmount?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  sellFee?: number;

  @IsOptional()
  @IsObject()
  buyProvider?: Provider;

  @IsOptional()
  @IsUUID(4)
  buyProviderOrderId?: string;

  @IsOptional()
  @IsString()
  buyProviderName?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  buyExecutedPrice?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  buyExecutedAmount?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  buyPriceSignificantDigits?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  buyFee?: number;

  @IsOptional()
  @IsObject()
  sellOrder?: CryptoOrder;

  @IsOptional()
  @IsObject()
  buyOrder?: CryptoOrder;

  @IsOptional()
  @IsString()
  failedCode?: string;

  @IsOptional()
  @IsString()
  failedMessage?: string;

  @IsUUID(4)
  @IsOptional()
  buyRemittanceId?: Remittance['id'];

  @IsInt()
  @IsPositive()
  @IsOptional()
  buyBankQuote?: Remittance['bankQuote'];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format date createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format date updatedAt',
  })
  updatedAt: Date;

  constructor(props: TGetBotOtcOrderByIdResponse) {
    super(props);
  }
}

export class GetBotOtcOrderByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    botOtcOrderRepository: BotOtcOrderRepository,
  ) {
    this.logger = logger.child({
      context: GetBotOtcOrderByIdController.name,
    });

    this.usecase = new UseCase(logger, botOtcOrderRepository);
  }

  async execute(
    request: GetBotOtcOrderByIdRequest,
  ): Promise<GetBotOtcOrderByIdResponse> {
    this.logger.debug('Get bot otc order by id request.', {
      request,
    });

    const { id } = request;

    const result = await this.usecase.execute(id);

    if (!result) return null;

    const botOtcOrder = new GetBotOtcOrderByIdResponse({
      id: result.id,
      botOtc: result.botOtc,
      state: result.state,
      baseCurrency: result.baseCurrency,
      quoteCurrency: result.quoteCurrency,
      market: result.market,
      amount: result.amount,
      type: result.type,
      sellStatus: result.sellStatus,
      sellPrice: result.sellPrice,
      sellStopPrice: result.sellStopPrice,
      sellValidUntil: result.sellValidUntil,
      sellProvider: result.sellProvider,
      sellProviderOrderId: result.sellProviderOrderId,
      sellProviderName: result.sellProviderName,
      sellExecutedPrice: result.sellExecutedPrice,
      sellExecutedAmount: result.sellExecutedAmount,
      sellFee: result.sellFee,
      buyProvider: result.buyProvider,
      buyProviderOrderId: result.buyProviderOrderId,
      buyProviderName: result.buyProviderName,
      buyExecutedPrice: result.buyExecutedPrice,
      buyExecutedAmount: result.buyExecutedAmount,
      buyPriceSignificantDigits: result.buyPriceSignificantDigits,
      buyFee: result.buyFee,
      sellOrder: result.sellOrder,
      buyOrder: result.buyOrder,
      failedCode: result.failedCode,
      failedMessage: result.failedMessage,
      buyBankQuote: result.buyRemittance?.bankQuote,
      buyRemittanceId: result.buyRemittance?.id,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });

    this.logger.debug('Get bot otc order by id response.', {
      botOtcOrder,
    });

    return botOtcOrder;
  }
}
