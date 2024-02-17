import { Logger } from 'winston';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  AutoValidator,
  IsHourTimeFormat,
  IsIsoStringDateFormat,
} from '@zro/common';
import { Spread, SpreadRepository } from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  CreateSpreadUseCase as UseCase,
  OperationService,
} from '@zro/otc/application';
import {
  SpreadEventEmitterController,
  SpreadEventEmitterControllerInterface,
} from '@zro/otc/interface';

type TCreateSpreadItemRequest = Pick<Spread, 'buy' | 'sell' | 'amount'>;

class CreateSpreadItemRequest
  extends AutoValidator
  implements TCreateSpreadItemRequest
{
  @IsInt()
  buy: number;

  @IsInt()
  sell: number;

  @IsInt()
  amount: number;

  constructor(props: TCreateSpreadItemRequest) {
    super(props);
  }
}

type TCreateSpreadRequest = {
  currencySymbol: Currency['symbol'];
  items: CreateSpreadItemRequest[];
};

export class CreateSpreadRequest
  extends AutoValidator
  implements TCreateSpreadRequest
{
  @IsString()
  currencySymbol: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSpreadItemRequest)
  items: CreateSpreadItemRequest[];

  constructor(props: TCreateSpreadRequest) {
    super(
      Object.assign({}, props, {
        items: props.items.map((item) => new CreateSpreadItemRequest(item)),
      }),
    );
  }
}

type TCreateSpreadResponse = Pick<
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
> & { currencyId: number; currencySymbol: string };

export class CreateSpreadResponse
  extends AutoValidator
  implements TCreateSpreadResponse
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

  constructor(props: TCreateSpreadResponse) {
    super(props);
  }
}

export class CreateSpreadController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    spreadRepository: SpreadRepository,
    operationService: OperationService,
    serviceEventEmitter: SpreadEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: CreateSpreadController.name });

    const eventEmitter = new SpreadEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      spreadRepository,
      operationService,
      eventEmitter,
    );
  }

  async execute(request: CreateSpreadRequest): Promise<CreateSpreadResponse[]> {
    this.logger.debug('Create Spreads request.', { request });

    const { items, currencySymbol } = request;

    const source = new CurrencyEntity({ symbol: currencySymbol });

    const results = await this.usecase.execute(source, items);

    return results.map(
      (spread) =>
        new CreateSpreadResponse({
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
  }
}
