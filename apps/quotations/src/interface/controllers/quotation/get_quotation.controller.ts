import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { OrderSide, Provider, Spread } from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  HolidayRepository,
  Quotation,
  QuotationRepository,
  StreamPair,
  StreamPairRepository,
  StreamQuotationRepository,
  Tax,
  TaxRepository,
} from '@zro/quotations/domain';
import { GetQuotationUseCase, OtcService } from '@zro/quotations/application';

type TGetQuotationRequest = Pick<Quotation, 'side'> & {
  userId: User['uuid'];
  amount: number;
  amountCurrencySymbol: Currency['symbol'];
  baseCurrencySymbol: Currency['symbol'];
};

export class GetQuotationRequest
  extends AutoValidator
  implements TGetQuotationRequest
{
  @IsUUID(4)
  userId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  amountCurrencySymbol: string;

  @IsString()
  baseCurrencySymbol: string;

  @IsEnum(OrderSide)
  side: OrderSide;

  constructor(props: TGetQuotationRequest) {
    super(props);
  }
}

type TGetQuotationResponse = Pick<
  Quotation,
  | 'id'
  | 'price'
  | 'priceBuy'
  | 'priceSell'
  | 'side'
  | 'partialBuy'
  | 'partialSell'
  | 'iofAmount'
  | 'spreadBuy'
  | 'spreadSell'
  | 'spreadAmountBuy'
  | 'spreadAmountSell'
  | 'quoteAmountBuy'
  | 'quoteAmountSell'
  | 'baseAmountBuy'
  | 'baseAmountSell'
  | 'streamQuotation'
> & {
  providerName: Provider['name'];
  streamPairId: StreamPair['id'];
  iofId: Tax['id'];
  iofValue: Tax['value'];
  spreadIds: Spread['id'][];
  quoteCurrencyId: Currency['id'];
  quoteCurrencySymbol: Currency['symbol'];
  quoteCurrencyDecimal: Currency['decimal'];
  quoteCurrencyTitle: Currency['title'];
  baseCurrencyId: Currency['id'];
  baseCurrencySymbol: Currency['symbol'];
  baseCurrencyDecimal: Currency['decimal'];
  baseCurrencyTitle: Currency['title'];
  ttl: Date;
};

export class GetQuotationResponse
  extends AutoValidator
  implements TGetQuotationResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  price: number;

  @IsInt()
  @IsPositive()
  priceBuy: number;

  @IsInt()
  @IsPositive()
  priceSell: number;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsInt()
  @IsPositive()
  partialBuy: number;

  @IsInt()
  @IsPositive()
  partialSell: number;

  @IsUUID(4)
  iofId: Tax['id'];

  @IsInt()
  @IsPositive()
  iofAmount: number;

  @IsInt()
  @IsPositive()
  iofValue: number;

  @IsString()
  providerName: Provider['name'];

  @IsUUID(4)
  streamPairId: StreamPair['id'];

  @IsUUID(4, { each: true })
  spreadIds: string[];

  @IsInt()
  @Min(0)
  spreadBuy: number;

  @IsInt()
  @Min(0)
  spreadSell: number;

  @IsInt()
  @Min(0)
  spreadAmountBuy: number;

  @IsInt()
  @Min(0)
  spreadAmountSell: number;

  @IsInt()
  @IsPositive()
  quoteCurrencyId: number;

  @IsInt()
  @IsPositive()
  quoteAmountBuy: number;

  @IsInt()
  @IsPositive()
  quoteAmountSell: number;

  @IsString()
  quoteCurrencySymbol: string;

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: number;

  @IsString()
  quoteCurrencyTitle: string;

  @IsInt()
  @IsPositive()
  baseCurrencyId: number;

  @IsInt()
  @IsPositive()
  baseAmountBuy: number;

  @IsInt()
  @IsPositive()
  baseAmountSell: number;

  @IsString()
  baseCurrencySymbol: string;

  @IsInt()
  @Min(0)
  baseCurrencyDecimal: number;

  @IsString()
  baseCurrencyTitle: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format ttl',
  })
  ttl: Date;

  @IsObject()
  streamQuotation: Quotation['streamQuotation'];

  constructor(props: TGetQuotationResponse) {
    super(props);
  }
}

export class GetQuotationController {
  private usecase: GetQuotationUseCase;

  constructor(
    private logger: Logger,
    streamPairRepository: StreamPairRepository,
    streamQuotationRepository: StreamQuotationRepository,
    quotationRepository: QuotationRepository,
    taxRepository: TaxRepository,
    holidayRepository: HolidayRepository,
    otcService: OtcService,
    operationCurrencySymbol: string,
    otcTaxIofName: string,
    private readonly quotationCacheTTL: number,
  ) {
    this.logger = logger.child({ context: GetQuotationController.name });

    this.usecase = new GetQuotationUseCase(
      logger,
      streamPairRepository,
      streamQuotationRepository,
      quotationRepository,
      taxRepository,
      holidayRepository,
      otcService,
      operationCurrencySymbol,
      otcTaxIofName,
    );
  }

  async execute(request: GetQuotationRequest): Promise<GetQuotationResponse> {
    this.logger.debug('Get quotation request.', { request });

    const { amount, side, userId } = request;

    const user = new UserEntity({ uuid: userId });
    const amountCurrency = new CurrencyEntity({
      symbol: request.amountCurrencySymbol,
    });
    const baseCurrency = new CurrencyEntity({
      symbol: request.baseCurrencySymbol,
    });

    const result = await this.usecase.execute(
      user,
      amount,
      amountCurrency,
      baseCurrency,
      side,
    );

    if (!result) return null;

    const response = new GetQuotationResponse({
      id: result.id,
      price: result.price,
      priceBuy: result.priceBuy,
      priceSell: result.priceSell,
      side: result.side,

      partialBuy: result.partialBuy,
      partialSell: result.partialSell,

      streamPairId: result.streamPair.id,
      providerName: result.provider.name,
      iofId: result.iof.id,
      iofValue: result.iof.value,
      iofAmount: result.iofAmount,

      spreadIds: result.spreads.map(({ id }) => id),
      spreadBuy: result.spreadBuy,
      spreadSell: result.spreadSell,
      spreadAmountBuy: result.spreadAmountBuy,
      spreadAmountSell: result.spreadAmountSell,

      quoteAmountBuy: result.quoteAmountBuy,
      quoteAmountSell: result.quoteAmountSell,
      quoteCurrencyId: result.quoteCurrency.id,
      quoteCurrencySymbol: result.quoteCurrency.symbol,
      quoteCurrencyDecimal: result.quoteCurrency.decimal,
      quoteCurrencyTitle: result.quoteCurrency.title,

      baseAmountBuy: result.baseAmountBuy,
      baseAmountSell: result.baseAmountSell,
      baseCurrencyId: result.baseCurrency.id,
      baseCurrencySymbol: result.baseCurrency.symbol,
      baseCurrencyDecimal: result.baseCurrency.decimal,
      baseCurrencyTitle: result.baseCurrency.title,

      // TTL value is 95% of the cache TTL
      ttl: new Date(Date.now() + 0.95 * this.quotationCacheTTL),

      streamQuotation: result.streamQuotation,
    });

    this.logger.debug('Get quotation response.', { response });

    return response;
  }
}
