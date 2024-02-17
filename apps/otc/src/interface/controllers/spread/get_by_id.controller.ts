import { Logger } from 'winston';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  AutoValidator,
  IsHourTimeFormat,
  IsIsoStringDateFormat,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { Spread, SpreadRepository } from '@zro/otc/domain';
import { GetSpreadByIdUseCase as UseCase } from '@zro/otc/application';

type TGetSpreadByIdRequest = Pick<Spread, 'id'>;

export class GetSpreadByIdRequest
  extends AutoValidator
  implements TGetSpreadByIdRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TGetSpreadByIdRequest) {
    super(props);
  }
}

type TGetSpreadByIdResponse = Pick<
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

export class GetSpreadByIdResponse
  extends AutoValidator
  implements TGetSpreadByIdResponse
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

  constructor(props: TGetSpreadByIdResponse) {
    super(props);
  }
}

export class GetSpreadByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({ context: GetSpreadByIdController.name });
    this.usecase = new UseCase(this.logger, spreadRepository);
  }

  async execute(request: GetSpreadByIdRequest): Promise<GetSpreadByIdResponse> {
    this.logger.debug('GetById Spread request.', { request });

    const { id } = request;

    const spread = await this.usecase.execute(id);

    if (!spread) return null;

    const response = new GetSpreadByIdResponse({
      id: spread.id,
      buy: spread.buy,
      sell: spread.sell,
      amount: spread.amount,
      offMarketBuy: spread.offMarketBuy,
      offMarketSell: spread.offMarketSell,
      currencySymbol: spread.currency.symbol,
      currencyId: spread.currency.id,
      createdAt: spread.createdAt,
    });

    return response;
  }
}
