import { Logger } from 'winston';
import {
  IsEnum,
  IsNumber,
  IsOptional,
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
import { CreateCurrencyUseCase as UseCase } from '@zro/operations/application';

type TCreateCurrencyRequest = Pick<
  Currency,
  'title' | 'symbol' | 'tag' | 'decimal' | 'type'
> &
  Partial<Pick<Currency, 'symbolAlign' | 'state'>>;

export class CreateCurrencyRequest
  extends AutoValidator
  implements TCreateCurrencyRequest
{
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

  @IsOptional()
  @IsEnum(CurrencySymbolAlign)
  symbolAlign?: CurrencySymbolAlign;

  @IsOptional()
  @IsEnum(CurrencyState)
  state?: CurrencyState;

  constructor(props: TCreateCurrencyRequest) {
    super(props);
  }
}

type TCreateCurrencyResponse = Pick<
  Currency,
  | 'id'
  | 'title'
  | 'symbol'
  | 'tag'
  | 'decimal'
  | 'type'
  | 'symbolAlign'
  | 'state'
>;

export class CreateCurrencyResponse
  extends AutoValidator
  implements TCreateCurrencyResponse
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

  constructor(props: TCreateCurrencyResponse) {
    super(props);
  }
}

export class CreateCurrencyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: CreateCurrencyController.name });

    this.usecase = new UseCase(this.logger, currencyRepository);
  }

  async execute(
    request: CreateCurrencyRequest,
  ): Promise<CreateCurrencyResponse> {
    const { title, symbol, tag, decimal, type, symbolAlign, state } = request;
    this.logger.debug('Create Currency request.', { request });

    const currency = await this.usecase.execute(
      title,
      symbol,
      tag,
      decimal,
      type,
      symbolAlign,
      state,
    );

    if (!currency) return null;

    const response = new CreateCurrencyResponse({
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
