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
import {
  AutoValidator,
  IsBiggestThan,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  IsSmallerThan,
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { GetAllBotOtcOrdersByFilterUseCase as UseCase } from '@zro/otc-bot/application';
import {
  BotOtc,
  BotOtcOrder,
  BotOtcOrderRepository,
  BotOtcOrderRequestSort,
  BotOtcOrderState,
  TGetBotOtcOrdersFilter,
} from '@zro/otc-bot/domain';
import {
  CryptoMarket,
  CryptoOrder,
  CryptoRemittanceStatus,
  OrderType,
  Provider,
  Remittance,
} from '@zro/otc/domain';

type TGetAllBotOtcOrdersByFilterRequest = Pagination & TGetBotOtcOrdersFilter;

export class GetAllBotOtcOrdersByFilterRequest
  extends PaginationRequest
  implements TGetAllBotOtcOrdersByFilterRequest
{
  @IsOptional()
  @Sort(BotOtcOrderRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsEnum(BotOtcOrderState)
  state?: BotOtcOrderState;

  @IsOptional()
  @IsString()
  baseCurrencySymbol?: string;

  @IsOptional()
  @IsString()
  quoteCurrencySymbol?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsSmallerThan('amountEnd', true, {
    message: 'amountStart must be smaller than amountEnd',
  })
  amountStart?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('amountStart', true, {
    message: 'amountEnd must be greater than amountStart',
  })
  amountEnd?: number;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsEnum(CryptoRemittanceStatus)
  sellStatus?: CryptoRemittanceStatus;

  @IsOptional()
  @IsString()
  sellProviderName?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsSmallerThan('sellExecutedPriceEnd', true, {
    message: 'sellExecutedPriceStart must be smaller than sellExecutedPriceEnd',
  })
  sellExecutedPriceStart?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('sellExecutedPriceStart', true, {
    message: 'sellExecutedPriceEnd must be greater than sellExecutedPriceStart',
  })
  sellExecutedPriceEnd?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsSmallerThan('sellExecutedAmountEnd', true, {
    message:
      'sellExecutedAmountStart must be smaller than sellExecutedAmountEnd',
  })
  sellExecutedAmountStart?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('sellExecutedAmountStart', true, {
    message:
      'sellExecutedAmountEnd must be greater than sellExecutedAmountStart',
  })
  sellExecutedAmountEnd?: number;

  @IsOptional()
  @IsString()
  buyProviderName?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsSmallerThan('buyExecutedPriceEnd', true, {
    message: 'buyExecutedPriceStart must be smaller than buyExecutedPriceEnd',
  })
  buyExecutedPriceStart?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('buyExecutedPriceStart', true, {
    message: 'buyExecutedPriceEnd must be greater than buyExecutedPriceStart',
  })
  buyExecutedPriceEnd?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsSmallerThan('buyExecutedAmountEnd', true, {
    message: 'buyExecutedAmountStart must be smaller than buyExecutedAmountEnd',
  })
  buyExecutedAmountStart?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsBiggestThan('buyExecutedAmountStart', true, {
    message: 'buyExecutedAmountEnd must be greater than buyExecutedAmountStart',
  })
  buyExecutedAmountEnd?: number;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', false, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  createdAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', false, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  createdAtEnd?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updatedAtStart',
  })
  @IsDateBeforeThan('updatedAtEnd', false, {
    message: 'updatedAtStart must be before than updatedAtEnd',
  })
  updatedAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updatedAtEnd',
  })
  @IsDateAfterThan('updatedAtStart', false, {
    message: 'updatedAtEnd must be after than updatedAtStart',
  })
  updatedAtEnd?: Date;

  @IsOptional()
  @IsUUID(4)
  remittanceId?: string;
}

type TGetAllBotOtcOrdersByFilterResponseItem = BotOtcOrder & {
  buyRemittanceId?: Remittance['id'];
  buyBankQuote?: Remittance['bankQuote'];
};

export class GetAllBotOtcOrdersByFilterResponseItem
  extends AutoValidator
  implements TGetAllBotOtcOrdersByFilterResponseItem
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

  constructor(props: TGetAllBotOtcOrdersByFilterResponseItem) {
    super(props);
  }
}

export class GetAllBotOtcOrdersByFilterResponse extends PaginationResponse<GetAllBotOtcOrdersByFilterResponseItem> {}

export class GetAllBotOtcOrdersByFilterController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    botOtcOrderRepository: BotOtcOrderRepository,
  ) {
    this.logger = logger.child({
      context: GetAllBotOtcOrdersByFilterController.name,
    });

    this.usecase = new UseCase(this.logger, botOtcOrderRepository);
  }

  async execute(
    request: GetAllBotOtcOrdersByFilterRequest,
  ): Promise<GetAllBotOtcOrdersByFilterResponse> {
    this.logger.debug('Get all bot otc orders by filter request.', {
      request,
    });

    const {
      state,
      baseCurrencySymbol,
      quoteCurrencySymbol,
      amountStart,
      amountEnd,
      type,
      sellStatus,
      sellProviderName,
      sellExecutedPriceStart,
      sellExecutedPriceEnd,
      sellExecutedAmountStart,
      sellExecutedAmountEnd,
      buyProviderName,
      buyExecutedPriceStart,
      buyExecutedPriceEnd,
      buyExecutedAmountStart,
      buyExecutedAmountEnd,
      createdAtStart,
      createdAtEnd,
      updatedAtStart,
      updatedAtEnd,
      remittanceId,
      order,
      page,
      pageSize,
      sort,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: TGetBotOtcOrdersFilter = {
      ...(state && { state }),
      ...(baseCurrencySymbol && { baseCurrencySymbol }),
      ...(quoteCurrencySymbol && { quoteCurrencySymbol }),
      ...(amountStart && { amountStart }),
      ...(amountEnd && { amountEnd }),
      ...(type && { type }),
      ...(sellStatus && { sellStatus }),
      ...(sellProviderName && { sellProviderName }),
      ...(sellExecutedPriceStart && { sellExecutedPriceStart }),
      ...(sellExecutedPriceEnd && { sellExecutedPriceEnd }),
      ...(sellExecutedAmountStart && { sellExecutedAmountStart }),
      ...(sellExecutedAmountEnd && { sellExecutedAmountEnd }),
      ...(buyProviderName && { buyProviderName }),
      ...(buyExecutedPriceStart && { buyExecutedPriceStart }),
      ...(buyExecutedPriceEnd && { buyExecutedPriceEnd }),
      ...(buyExecutedAmountStart && { buyExecutedAmountStart }),
      ...(buyExecutedAmountEnd && { buyExecutedAmountEnd }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
      ...(updatedAtStart && { updatedAtStart }),
      ...(updatedAtEnd && { updatedAtEnd }),
      ...(remittanceId && { remittanceId }),
    };

    const result = await this.usecase.execute(pagination, filter);

    const data = result.data.map((botOtcOrder) => {
      return new GetAllBotOtcOrdersByFilterResponseItem({
        id: botOtcOrder.id,
        botOtc: botOtcOrder.botOtc,
        state: botOtcOrder.state,
        baseCurrency: botOtcOrder.baseCurrency,
        quoteCurrency: botOtcOrder.quoteCurrency,
        market: botOtcOrder.market,
        amount: botOtcOrder.amount,
        type: botOtcOrder.type,
        sellStatus: botOtcOrder.sellStatus,
        sellPrice: botOtcOrder.sellPrice,
        sellStopPrice: botOtcOrder.sellStopPrice,
        sellValidUntil: botOtcOrder.sellValidUntil,
        sellProvider: botOtcOrder.sellProvider,
        sellProviderOrderId: botOtcOrder.sellProviderOrderId,
        sellProviderName: botOtcOrder.sellProviderName,
        sellExecutedPrice: botOtcOrder.sellExecutedPrice,
        sellExecutedAmount: botOtcOrder.sellExecutedAmount,
        sellFee: botOtcOrder.sellFee,
        buyProvider: botOtcOrder.buyProvider,
        buyProviderOrderId: botOtcOrder.buyProviderOrderId,
        buyProviderName: botOtcOrder.buyProviderName,
        buyExecutedPrice: botOtcOrder.buyExecutedPrice,
        buyExecutedAmount: botOtcOrder.buyExecutedAmount,
        buyPriceSignificantDigits: botOtcOrder.buyPriceSignificantDigits,
        buyFee: botOtcOrder.buyFee,
        sellOrder: botOtcOrder.sellOrder,
        buyOrder: botOtcOrder.buyOrder,
        failedCode: botOtcOrder.failedCode,
        failedMessage: botOtcOrder.failedMessage,
        buyBankQuote: botOtcOrder.buyRemittance?.bankQuote,
        buyRemittanceId: botOtcOrder.buyRemittance?.id,
        createdAt: botOtcOrder.createdAt,
        updatedAt: botOtcOrder.updatedAt,
      });
    });

    const response = new GetAllBotOtcOrdersByFilterResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all bot otc orders by filter response.', {
      remittanceOrdens: response,
    });

    return response;
  }
}
