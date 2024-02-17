import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  Pagination,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
  AutoValidator,
  Sort,
  PaginationSort,
} from '@zro/common';
import {
  Currency,
  CurrencyRepository,
  CurrencyState,
  CurrencySymbolAlign,
  CurrencyType,
  TGetCurrencyFilter,
} from '@zro/operations/domain';
import { GetAllCurrencyUseCase as UseCase } from '@zro/operations/application';

export enum GetAllCurrencyRequestSort {
  ID = 'id',
}

type TGetAllCurrencyRequest = Pagination &
  Partial<
    Pick<
      Currency,
      'id' | 'title' | 'symbol' | 'symbolAlign' | 'tag' | 'decimal' | 'state'
    >
  >;

export class GetAllCurrencyRequest
  extends PaginationRequest
  implements TGetAllCurrencyRequest
{
  @IsOptional()
  @Sort(GetAllCurrencyRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  symbol?: string;

  @IsOptional()
  @IsEnum(CurrencySymbolAlign)
  symbolAlign?: CurrencySymbolAlign;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tag?: string;

  @IsOptional()
  @IsInt()
  decimal?: number;

  @IsOptional()
  @IsEnum(CurrencyState)
  state?: CurrencyState;

  constructor(props: TGetAllCurrencyRequest) {
    super(props);
  }
}

type TGetAllCurrencyResponseItem = Pick<
  Currency,
  | 'id'
  | 'title'
  | 'symbol'
  | 'symbolAlign'
  | 'tag'
  | 'type'
  | 'decimal'
  | 'state'
>;

export class GetAllCurrencyResponseItem
  extends AutoValidator
  implements TGetAllCurrencyResponseItem
{
  @IsInt()
  id!: number;

  @IsString()
  title!: string;

  @IsString()
  symbol!: string;

  @IsEnum(CurrencySymbolAlign)
  symbolAlign!: CurrencySymbolAlign;

  @IsString()
  tag!: string;

  @IsEnum(CurrencyType)
  type: CurrencyType;

  @IsInt()
  decimal!: number;

  @IsEnum(CurrencyState)
  state!: CurrencyState;

  constructor(props: TGetAllCurrencyResponseItem) {
    super(props);
  }
}

export class GetAllCurrencyResponse extends PaginationResponse<GetAllCurrencyResponseItem> {}

export class GetAllCurrencyController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({ context: GetAllCurrencyController.name });
    this.usecase = new UseCase(this.logger, currencyRepository);
  }

  async execute(
    request: GetAllCurrencyRequest,
  ): Promise<GetAllCurrencyResponse> {
    this.logger.debug('Get all currencies request.', { request });

    const {
      id,
      title,
      symbol,
      symbolAlign,
      tag,
      decimal,
      state,
      order,
      page,
      pageSize,
      sort,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: TGetCurrencyFilter = {
      ...(id && { id }),
      ...(title && { title }),
      ...(symbol && { symbol }),
      ...(symbolAlign && { symbolAlign }),
      ...(tag && { tag }),
      ...(decimal && { decimal }),
      ...(state && { state }),
    };

    const currencies = await this.usecase.execute(pagination, filter);

    const data = currencies.data.map(
      (currency) =>
        new GetAllCurrencyResponseItem({
          id: currency.id,
          title: currency.title,
          symbol: currency.symbol,
          symbolAlign: currency.symbolAlign,
          tag: currency.tag,
          type: currency.type,
          decimal: currency.decimal,
          state: currency.state,
        }),
    );

    const response = new GetAllCurrencyResponse({ ...currencies, data });

    this.logger.info('Get all currencies response.', { currencies: response });

    return response;
  }
}
