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
import { GetCurrencyByIdUseCase as UseCase } from '@zro/operations/application';

type TGetCurrencyByIdRequest = Pick<Currency, 'id'>;

export class GetCurrencyByIdRequest
  extends AutoValidator
  implements TGetCurrencyByIdRequest
{
  @IsPositive()
  id: number;

  constructor(props: GetCurrencyByIdRequest) {
    super(props);
  }
}

type TGetCurrencyByIdResponse = Pick<
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

export class GetCurrencyByIdResponse
  extends AutoValidator
  implements TGetCurrencyByIdResponse
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

  constructor(props: TGetCurrencyByIdResponse) {
    super(props);
  }
}

export class GetCurrencyByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: GetCurrencyByIdController.name });

    this.usecase = new UseCase(this.logger, currencyRepository);
  }

  async execute(
    request: GetCurrencyByIdRequest,
  ): Promise<GetCurrencyByIdResponse> {
    this.logger.debug('Get by Currency id request.', { request });

    const { id } = request;

    const currency = await this.usecase.execute(id);

    if (!currency) return null;

    const response = new GetCurrencyByIdResponse({
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
