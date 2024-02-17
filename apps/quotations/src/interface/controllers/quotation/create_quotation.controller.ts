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
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  OrderSide,
  Provider,
  ProviderEntity,
  Spread,
  SpreadEntity,
} from '@zro/otc/domain';
import {
  Quotation,
  QuotationRepository,
  StreamPair,
  StreamPairEntity,
  Tax,
  TaxEntity,
} from '@zro/quotations/domain';
import { CreateQuotationUseCase } from '@zro/quotations/application';

type TCreateQuotationRequest = Pick<
  Quotation,
  | 'id'
  | 'side'
  | 'price'
  | 'priceBuy'
  | 'priceSell'
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
  spreadIds: Spread['id'][];
  quoteCurrencyId: Currency['id'];
  quoteCurrencySymbol: Currency['symbol'];
  quoteCurrencyDecimal: Currency['decimal'];
  quoteCurrencyTitle: Currency['title'];
  baseCurrencyId: Currency['id'];
  baseCurrencySymbol: Currency['symbol'];
  baseCurrencyDecimal: Currency['decimal'];
  baseCurrencyTitle: Currency['title'];
};

export class CreateQuotationRequest
  extends AutoValidator
  implements TCreateQuotationRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  providerName: Provider['name'];

  @IsUUID(4)
  streamPairId: StreamPair['id'];

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsInt()
  @IsPositive()
  price: number;

  @IsInt()
  @IsPositive()
  priceBuy: number;

  @IsInt()
  @IsPositive()
  priceSell: number;

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

  @IsString()
  quoteCurrencySymbol: string;

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: number;

  @IsString()
  quoteCurrencyTitle: string;

  @IsInt()
  @IsPositive()
  quoteAmountBuy: number;

  @IsInt()
  @IsPositive()
  quoteAmountSell: number;

  @IsInt()
  @IsPositive()
  baseAmountBuy: number;

  @IsInt()
  @IsPositive()
  baseAmountSell: number;

  @IsInt()
  @IsPositive()
  baseCurrencyId: number;

  @IsString()
  baseCurrencySymbol: string;

  @IsInt()
  @Min(0)
  baseCurrencyDecimal: number;

  @IsString()
  baseCurrencyTitle: string;

  @IsObject()
  streamQuotation: Quotation['streamQuotation'];

  constructor(props: TCreateQuotationRequest) {
    super(props);
  }
}

type TCreateQuotationResponse = Pick<
  Quotation,
  | 'id'
  | 'side'
  | 'price'
  | 'priceBuy'
  | 'priceSell'
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
  | 'createdAt'
> & {
  providerName: Provider['name'];
  streamPairId: StreamPair['id'];
  iofId: Tax['id'];
  spreadIds: Spread['id'][];
  quoteCurrencyId: Currency['id'];
  quoteCurrencySymbol: Currency['symbol'];
  quoteCurrencyDecimal: Currency['decimal'];
  quoteCurrencyTitle: Currency['title'];
  baseCurrencyId: Currency['id'];
  baseCurrencySymbol: Currency['symbol'];
  baseCurrencyDecimal: Currency['decimal'];
  baseCurrencyTitle: Currency['title'];
};

export class CreateQuotationResponse
  extends AutoValidator
  implements TCreateQuotationResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  providerName: Provider['name'];

  @IsUUID(4)
  streamPairId: StreamPair['id'];

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsInt()
  @IsPositive()
  price: number;

  @IsInt()
  @IsPositive()
  priceBuy: number;

  @IsInt()
  @IsPositive()
  priceSell: number;

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
  quoteAmountBuy: number;

  @IsInt()
  @IsPositive()
  quoteAmountSell: number;

  @IsInt()
  @IsPositive()
  quoteCurrencyId: Currency['id'];

  @IsString()
  quoteCurrencySymbol: string;

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: number;

  @IsString()
  quoteCurrencyTitle: string;

  @IsInt()
  @IsPositive()
  baseAmountBuy: number;

  @IsInt()
  @IsPositive()
  baseAmountSell: number;

  @IsInt()
  @IsPositive()
  baseCurrencyId: Currency['id'];

  @IsString()
  baseCurrencySymbol: string;

  @IsInt()
  @Min(0)
  baseCurrencyDecimal: number;

  @IsString()
  baseCurrencyTitle: string;

  @IsObject()
  streamQuotation: Quotation['streamQuotation'];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateQuotationResponse) {
    super(props);
  }
}

export class CreateQuotationController {
  private usecase: CreateQuotationUseCase;

  constructor(
    private logger: Logger,
    quotationRepository: QuotationRepository,
  ) {
    this.logger = logger.child({ context: CreateQuotationController.name });

    this.usecase = new CreateQuotationUseCase(logger, quotationRepository);
  }

  async execute(
    request: CreateQuotationRequest,
  ): Promise<CreateQuotationResponse> {
    this.logger.debug('Create quotation request.', { request });

    const {
      id,
      providerName,
      streamPairId,
      side,
      price,
      priceBuy,
      priceSell,
      partialBuy,
      partialSell,
      iofId,
      iofAmount,
      spreadIds,
      spreadBuy,
      spreadSell,
      spreadAmountBuy,
      spreadAmountSell,
      quoteCurrencyId,
      quoteCurrencyTitle,
      quoteCurrencySymbol,
      quoteCurrencyDecimal,
      quoteAmountBuy,
      quoteAmountSell,
      baseCurrencyId,
      baseCurrencyTitle,
      baseCurrencySymbol,
      baseCurrencyDecimal,
      baseAmountBuy,
      baseAmountSell,
      streamQuotation,
    } = request;

    const provider = new ProviderEntity({ name: providerName });
    const streamPair = new StreamPairEntity({ id: streamPairId });
    const iof = new TaxEntity({ id: iofId });
    const spreads = spreadIds.map((id) => new SpreadEntity({ id }));
    const quoteCurrency = new CurrencyEntity({
      id: quoteCurrencyId,
      title: quoteCurrencyTitle,
      symbol: quoteCurrencySymbol,
      decimal: quoteCurrencyDecimal,
    });
    const baseCurrency = new CurrencyEntity({
      id: baseCurrencyId,
      title: baseCurrencyTitle,
      symbol: baseCurrencySymbol,
      decimal: baseCurrencyDecimal,
    });

    const result = await this.usecase.execute(
      id,
      provider,
      streamPair,
      side,
      price,
      priceBuy,
      priceSell,
      partialBuy,
      partialSell,
      iof,
      iofAmount,
      spreads,
      spreadBuy,
      spreadSell,
      spreadAmountBuy,
      spreadAmountSell,
      quoteCurrency,
      quoteAmountBuy,
      quoteAmountSell,
      baseCurrency,
      baseAmountBuy,
      baseAmountSell,
      streamQuotation,
    );

    if (!result) return null;

    const response = new CreateQuotationResponse({
      id: result.id,
      providerName: result.provider.name,
      streamPairId: result.streamPair.id,
      side: result.side,
      price: result.price,
      priceBuy: result.priceBuy,
      priceSell: result.priceSell,
      partialBuy: result.partialBuy,
      partialSell: result.partialSell,
      iofId: result.iof.id,
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
      streamQuotation: result.streamQuotation,
      createdAt: result.createdAt,
    });

    this.logger.debug('Create quotation response.', { response });

    return response;
  }
}
