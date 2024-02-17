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
import { GetCurrencyByTagUseCase as UseCase } from '@zro/operations/application';

type TGetCurrencyByTagRequest = Pick<Currency, 'tag'>;

export class GetCurrencyByTagRequest
  extends AutoValidator
  implements TGetCurrencyByTagRequest
{
  @IsString()
  @MaxLength(255)
  tag: string;

  constructor(props: GetCurrencyByTagRequest) {
    super(props);
  }
}

type TGetCurrencyByTagResponse = Pick<
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

export class GetCurrencyByTagResponse
  extends AutoValidator
  implements TGetCurrencyByTagResponse
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

  @IsEnum(CurrencyType)
  type: CurrencyType;

  @IsNumber()
  decimal: number;

  @IsEnum(CurrencySymbolAlign)
  symbolAlign: CurrencySymbolAlign;

  @IsEnum(CurrencyState)
  state: CurrencyState;

  constructor(props: TGetCurrencyByTagResponse) {
    super(props);
  }
}

export class GetCurrencyByTagController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: GetCurrencyByTagController.name });

    this.usecase = new UseCase(this.logger, currencyRepository);
  }

  async execute(
    request: GetCurrencyByTagRequest,
  ): Promise<GetCurrencyByTagResponse> {
    this.logger.debug('Get by Currency tag request.', { request });

    const { tag } = request;

    const currency = await this.usecase.execute(tag);

    if (!currency) return null;

    const response = new GetCurrencyByTagResponse({
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
