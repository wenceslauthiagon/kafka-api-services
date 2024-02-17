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
import { User, UserEntity } from '@zro/users/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { Spread, SpreadRepository } from '@zro/otc/domain';
import { GetSpreadsByUserAndCurrenciesUseCase as UseCase } from '@zro/otc/application';

type TGetSpreadsByUserAndCurrenciesRequest = {
  userId: User['uuid'];
  currencySymbols: Currency['symbol'][];
};

export class GetSpreadsByUserAndCurrenciesRequest
  extends AutoValidator
  implements TGetSpreadsByUserAndCurrenciesRequest
{
  @IsUUID(4)
  userId: string;

  @IsString({ each: true })
  currencySymbols: string[];

  constructor(props: TGetSpreadsByUserAndCurrenciesRequest) {
    super(props);
  }
}

type TGetSpreadsByUserAndCurrenciesResponse = Pick<
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

export class GetSpreadsByUserAndCurrenciesResponse
  extends AutoValidator
  implements TGetSpreadsByUserAndCurrenciesResponse
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

  constructor(props: TGetSpreadsByUserAndCurrenciesResponse) {
    super(props);
  }
}

export class GetSpreadsByUserAndCurrenciesController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({
      context: GetSpreadsByUserAndCurrenciesController.name,
    });
    this.usecase = new UseCase(this.logger, spreadRepository);
  }

  async execute(
    request: GetSpreadsByUserAndCurrenciesRequest,
  ): Promise<GetSpreadsByUserAndCurrenciesResponse[]> {
    this.logger.debug('Get Spread by user and currencies request.', {
      request,
    });

    const { userId, currencySymbols } = request;
    const user = new UserEntity({ uuid: userId });
    const currencies = currencySymbols.map(
      (item) => new CurrencyEntity({ symbol: item }),
    );

    const result = await this.usecase.execute(user, currencies);

    const response = result.map(
      (item) =>
        new GetSpreadsByUserAndCurrenciesResponse({
          id: item.id,
          buy: item.buy,
          sell: item.sell,
          amount: item.amount,
          currencyId: item.currency.id,
          currencySymbol: item.currency.symbol,
          offMarketBuy: item.offMarketBuy,
          offMarketSell: item.offMarketSell,
          offMarketTimeStart: item.offMarketTimeStart,
          offMarketTimeEnd: item.offMarketTimeEnd,
          createdAt: item.createdAt,
        }),
    );

    return response;
  }
}
