import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { OrderSide, Provider, Spread } from '@zro/otc/domain';
import {
  Quotation,
  QuotationRepository,
  StreamPair,
  Tax,
} from '@zro/quotations/domain';
import { GetQuotationByIdUseCase } from '@zro/quotations/application';

type GeteQuotationByIdRequest = Pick<Quotation, 'id'>;

export class GetQuotationByIdRequest
  extends AutoValidator
  implements GeteQuotationByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: GeteQuotationByIdRequest) {
    super(props);
  }
}

type GeteQuotationByIdResponse = Pick<
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

export class GetQuotationByIdResponse
  extends AutoValidator
  implements GeteQuotationByIdResponse
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
  @IsOptional()
  spreadBuy: number;

  @IsInt()
  @Min(0)
  @IsOptional()
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
  quoteCurrencyId: number;

  @IsString()
  @IsOptional()
  quoteCurrencySymbol: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quoteCurrencyDecimal: number;

  @IsString()
  @IsOptional()
  quoteCurrencyTitle: string;

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
  @IsOptional()
  baseCurrencySymbol: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  baseCurrencyDecimal: number;

  @IsString()
  @IsOptional()
  baseCurrencyTitle: string;

  @IsObject()
  streamQuotation: Quotation['streamQuotation'];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: GeteQuotationByIdResponse) {
    super(props);
  }
}

export class GetQuotationByIdController {
  private usecase: GetQuotationByIdUseCase;

  constructor(
    private logger: Logger,
    quotationRepository: QuotationRepository,
  ) {
    this.logger = logger.child({ context: GetQuotationByIdController.name });

    this.usecase = new GetQuotationByIdUseCase(logger, quotationRepository);
  }

  async execute(
    request: GetQuotationByIdRequest,
  ): Promise<GetQuotationByIdResponse> {
    this.logger.debug('Get quotation by id request.', { request });

    const { id } = request;

    const result = await this.usecase.execute(id);

    if (!result) return null;

    const response = new GetQuotationByIdResponse({
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

    this.logger.debug('Get quotation by id response.', { response });

    return response;
  }
}
