import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Quotation } from '@zro/quotations/domain';
import { Currency } from '@zro/operations/domain';
import { Conversion, ConversionRepository, OrderSide } from '@zro/otc/domain';
import {
  GetQuotationByConversionIdAndUserUseCase as UseCase,
  QuotationService,
} from '@zro/otc/application';

type UserId = User['uuid'];

export type TGetQuotationByConversionIdAndUserRequest = Pick<
  Conversion,
  'id'
> & { userId: UserId };

export class GetQuotationByConversionIdAndUserRequest
  extends AutoValidator
  implements TGetQuotationByConversionIdAndUserRequest
{
  @IsUUID(4)
  id: Conversion['id'];

  @IsUUID(4)
  userId: UserId;

  constructor(props: TGetQuotationByConversionIdAndUserRequest) {
    super(props);
  }
}

type TGetQuotationByConversionIdAndUserResponse = Pick<
  Quotation,
  | 'id'
  | 'priceBuy'
  | 'priceSell'
  | 'side'
  | 'quoteAmountBuy'
  | 'quoteAmountSell'
  | 'baseAmountBuy'
  | 'baseAmountSell'
  | 'createdAt'
> & {
  quoteCurrencySymbol?: Currency['symbol'];
  quoteCurrencyDecimal?: Currency['decimal'];
  quoteCurrencyTitle?: Currency['title'];
  baseCurrencySymbol?: Currency['symbol'];
  baseCurrencyDecimal?: Currency['decimal'];
  baseCurrencyTitle?: Currency['title'];
};

export class GetQuotationByConversionIdAndUserResponse
  extends AutoValidator
  implements TGetQuotationByConversionIdAndUserResponse
{
  @IsUUID(4)
  id: string;

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
  quoteAmountBuy: number;

  @IsInt()
  @IsPositive()
  quoteAmountSell: number;

  @IsString()
  @IsOptional()
  quoteCurrencySymbol?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quoteCurrencyDecimal?: number;

  @IsString()
  @IsOptional()
  quoteCurrencyTitle?: string;

  @IsInt()
  @IsPositive()
  baseAmountBuy: number;

  @IsInt()
  @IsPositive()
  baseAmountSell: number;

  @IsString()
  @IsOptional()
  baseCurrencySymbol?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  baseCurrencyDecimal?: number;

  @IsString()
  @IsOptional()
  baseCurrencyTitle?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetQuotationByConversionIdAndUserResponse) {
    super(props);
  }
}

export class GetQuotationByConversionIdAndUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    conversionRepository: ConversionRepository,
    quotationService: QuotationService,
  ) {
    this.logger = logger.child({
      context: GetQuotationByConversionIdAndUserController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      conversionRepository,
      quotationService,
    );
  }

  async execute(
    request: GetQuotationByConversionIdAndUserRequest,
  ): Promise<GetQuotationByConversionIdAndUserResponse> {
    this.logger.debug('Get quotation by conversion ID.', { request });

    const { userId, id } = request;

    const user = new UserEntity({ uuid: userId });
    const quotation = await this.usecase.execute(user, id);

    if (!quotation) return null;

    const response = new GetQuotationByConversionIdAndUserResponse({
      id: quotation.id,
      side: quotation.side,
      priceBuy: quotation.priceBuy,
      priceSell: quotation.priceSell,
      quoteAmountBuy: quotation.quoteAmountBuy,
      quoteAmountSell: quotation.quoteAmountSell,
      quoteCurrencySymbol: quotation.quoteCurrency?.symbol,
      quoteCurrencyDecimal: quotation.quoteCurrency?.decimal,
      quoteCurrencyTitle: quotation.quoteCurrency?.title,
      baseAmountBuy: quotation.baseAmountBuy,
      baseAmountSell: quotation.baseAmountSell,
      baseCurrencySymbol: quotation.baseCurrency?.symbol,
      baseCurrencyDecimal: quotation.baseCurrency?.decimal,
      baseCurrencyTitle: quotation.baseCurrency?.title,
      createdAt: quotation.createdAt,
    });

    return response;
  }
}
