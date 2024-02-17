import { Logger } from 'winston';
import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  Currency,
  CurrencyRepository,
  CurrencyState,
  CurrencySymbolAlign,
  CurrencyType,
} from '@zro/operations/domain';
import { GetCurrencyBySymbolUseCase as UseCase } from '@zro/operations/application';

type TGetCurrencyBySymbolRequest = Pick<Currency, 'symbol'>;

export class GetCurrencyBySymbolRequest
  extends AutoValidator
  implements TGetCurrencyBySymbolRequest
{
  @IsString()
  @MaxLength(255)
  symbol: string;

  constructor(props: GetCurrencyBySymbolRequest) {
    super(props);
  }
}

type TGetCurrencyBySymbolResponse = Pick<
  Currency,
  | 'id'
  | 'title'
  | 'symbol'
  | 'tag'
  | 'type'
  | 'decimal'
  | 'symbolAlign'
  | 'state'
>;

export class GetCurrencyBySymbolResponse
  extends AutoValidator
  implements TGetCurrencyBySymbolResponse
{
  @IsPositive()
  id: number;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(255)
  symbol: string;

  @IsString()
  @MaxLength(255)
  tag: string;

  @IsNumber()
  decimal: number;

  @IsEnum(CurrencyType)
  type: CurrencyType;

  @IsEnum(CurrencySymbolAlign)
  symbolAlign: CurrencySymbolAlign;

  @IsEnum(CurrencyState)
  state: CurrencyState;

  constructor(props: TGetCurrencyBySymbolResponse) {
    super(props);
  }
}

export class GetCurrencyBySymbolController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: GetCurrencyBySymbolController.name });

    this.usecase = new UseCase(this.logger, currencyRepository);
  }

  async execute(
    request: GetCurrencyBySymbolRequest,
  ): Promise<GetCurrencyBySymbolResponse> {
    const { symbol } = request;
    this.logger.debug('Get by Currency symbol request.', { request });

    const currency = await this.usecase.execute(symbol);

    if (!currency) return null;

    const response = new GetCurrencyBySymbolResponse({
      id: currency.id,
      title: currency.title,
      symbol: currency.symbol,
      symbolAlign: currency.symbolAlign,
      tag: currency.tag,
      type: currency.type,
      decimal: currency.decimal,
      state: currency.state,
    });

    return response;
  }
}
