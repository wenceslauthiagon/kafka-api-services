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
import { GetSpreadByUserAndCurrencyUseCase as UseCase } from '@zro/otc/application';

type TGetSpreadByUserAndCurrencyRequest = {
  userId: User['uuid'];
  currencySymbol: Currency['symbol'];
};

export class GetSpreadByUserAndCurrencyRequest
  extends AutoValidator
  implements TGetSpreadByUserAndCurrencyRequest
{
  @IsUUID(4)
  userId: string;

  @IsString()
  @MaxLength(255)
  currencySymbol: string;

  constructor(props: TGetSpreadByUserAndCurrencyRequest) {
    super(props);
  }
}

type TGetSpreadByUserAndCurrencyResponse = Pick<
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

export class GetSpreadByUserAndCurrencyResponse
  extends AutoValidator
  implements TGetSpreadByUserAndCurrencyResponse
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

  constructor(props: TGetSpreadByUserAndCurrencyResponse) {
    super(props);
  }
}

export class GetSpreadByUserAndCurrencyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({
      context: GetSpreadByUserAndCurrencyController.name,
    });
    this.usecase = new UseCase(this.logger, spreadRepository);
  }

  async execute(
    request: GetSpreadByUserAndCurrencyRequest,
  ): Promise<GetSpreadByUserAndCurrencyResponse> {
    this.logger.debug('Get Spread by user and currency request.', { request });

    const { userId, currencySymbol } = request;
    const user = new UserEntity({ uuid: userId });
    const currency = new CurrencyEntity({ symbol: currencySymbol });

    const result = await this.usecase.execute(user, currency);

    if (!result) return null;

    const response = new GetSpreadByUserAndCurrencyResponse({
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
