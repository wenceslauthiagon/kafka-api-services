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
  Pagination,
  PaginationEntity,
  PaginationRequest,
  PaginationResponse,
  PaginationSort,
  Sort,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { Spread, SpreadRepository } from '@zro/otc/domain';
import { GetAllSpreadUseCase as UseCase } from '@zro/otc/application';

export enum GetAllSpreadRequestSort {
  ID = 'id',
  BASE_ID = 'currency_id',
  CREATED_AT = 'created_at',
}

type TGetAllSpreadRequest = Pagination;

export class GetAllSpreadRequest
  extends PaginationRequest
  implements TGetAllSpreadRequest
{
  @IsOptional()
  @Sort(GetAllSpreadRequestSort)
  sort?: PaginationSort;

  constructor(props: TGetAllSpreadRequest) {
    super(props);
  }
}

type TGetAllSpreadResponseItem = Pick<
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

export class GetAllSpreadResponseItem
  extends AutoValidator
  implements TGetAllSpreadResponseItem
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

  constructor(props: TGetAllSpreadResponseItem) {
    super(props);
  }
}

export class GetAllSpreadResponse extends PaginationResponse<GetAllSpreadResponseItem> {}

export class GetAllSpreadController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({ context: GetAllSpreadController.name });
    this.usecase = new UseCase(this.logger, spreadRepository);
  }

  async execute(request: GetAllSpreadRequest): Promise<GetAllSpreadResponse> {
    this.logger.debug('GetAll Spreads request.', { request });

    const { order, page, pageSize, sort } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const results = await this.usecase.execute(pagination);

    const data = results.data.map(
      (spread) =>
        new GetAllSpreadResponseItem({
          id: spread.id,
          buy: spread.buy,
          sell: spread.sell,
          amount: spread.amount,
          currencyId: spread.currency.id,
          currencySymbol: spread.currency.symbol,
          offMarketBuy: spread.offMarketBuy,
          offMarketSell: spread.offMarketSell,
          offMarketTimeStart: spread.offMarketTimeStart,
          offMarketTimeEnd: spread.offMarketTimeEnd,
          createdAt: spread.createdAt,
        }),
    );

    const response = new GetAllSpreadResponse({ ...results, data });

    this.logger.debug('Get all filtered spreads response.', {
      spreads: response,
    });

    return response;
  }
}
