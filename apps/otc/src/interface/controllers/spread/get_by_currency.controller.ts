import { Logger } from 'winston';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AutoValidator,
  IsHourTimeFormat,
  IsIsoStringDateFormat,
} from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { Spread, SpreadRepository } from '@zro/otc/domain';
import { GetSpreadByCurrencyUseCase as UseCase } from '@zro/otc/application';

type TGetSpreadByCurrencyRequest = {
  currencySymbol: Currency['symbol'];
};

export class GetSpreadByCurrencyRequest
  extends AutoValidator
  implements TGetSpreadByCurrencyRequest
{
  @IsString()
  currencySymbol: string;

  constructor(props: TGetSpreadByCurrencyRequest) {
    super(props);
  }
}

type TGetSpreadByCurrencyResponse = Pick<
  Spread,
  | 'id'
  | 'buy'
  | 'sell'
  | 'amount'
  | 'offMarketBuy'
  | 'offMarketSell'
  | 'offMarketTimeStart'
  | 'offMarketTimeEnd'
  | 'createdAt'
> & { currencyId: Currency['id']; currencySymbol: Currency['symbol'] };

export class GetSpreadByCurrencyResponse
  extends AutoValidator
  implements TGetSpreadByCurrencyResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  buy: number;

  @IsInt()
  sell: number;

  @IsInt()
  amount: number;

  @IsInt()
  @IsPositive()
  currencyId: number;

  @IsString()
  @MaxLength(255)
  currencySymbol: string;

  @IsInt()
  @IsOptional()
  offMarketBuy?: number;

  @IsInt()
  @IsOptional()
  offMarketSell?: number;

  @IsString()
  @IsOptional()
  @IsHourTimeFormat()
  offMarketTimeStart?: string;

  @IsString()
  @IsOptional()
  @IsHourTimeFormat()
  offMarketTimeEnd?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetSpreadByCurrencyResponse) {
    super(props);
  }
}

export class GetSpreadByCurrencyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({
      context: GetSpreadByCurrencyController.name,
    });
    this.usecase = new UseCase(this.logger, spreadRepository);
  }

  async execute(
    request: GetSpreadByCurrencyRequest,
  ): Promise<GetSpreadByCurrencyResponse> {
    this.logger.debug('Get Spread by currency request.', { request });

    const { currencySymbol } = request;
    const currency = new CurrencyEntity({ symbol: currencySymbol });

    const result = await this.usecase.execute(currency);

    if (!result) return null;

    const response = new GetSpreadByCurrencyResponse({
      id: result.id,
      buy: result.buy,
      sell: result.sell,
      amount: result.amount,
      currencyId: result.currency.id,
      currencySymbol: result.currency.symbol,
      offMarketBuy: result.offMarketBuy,
      offMarketSell: result.offMarketSell,
      offMarketTimeStart: result.offMarketTimeStart,
      offMarketTimeEnd: result.offMarketTimeEnd,
      createdAt: result.createdAt,
    });

    return response;
  }
}
