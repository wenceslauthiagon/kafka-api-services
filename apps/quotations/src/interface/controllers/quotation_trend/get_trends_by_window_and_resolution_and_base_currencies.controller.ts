import { Logger } from 'winston';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  QuotationTrendRepository,
  QuotationTrendResolution,
  QuotationTrendWindow,
  StreamPairRepository,
} from '@zro/quotations/domain';
import {
  GetTrendsByWindowAndResolutionAndBaseAndQuoteCurrenciesUseCase as UseCase,
  OperationService,
} from '@zro/quotations/application';

type TGetTrendsByWindowAndResolutionAndBaseCurrenciesRequest = {
  window: QuotationTrendWindow;
  resolution: QuotationTrendResolution;
  baseCurrencySymbols: Currency['symbol'][];
};

export class GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest
  extends AutoValidator
  implements TGetTrendsByWindowAndResolutionAndBaseCurrenciesRequest
{
  @IsEnum(QuotationTrendWindow)
  window: QuotationTrendWindow;

  @IsEnum(QuotationTrendResolution)
  resolution: QuotationTrendResolution;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Length(1, 255, { each: true })
  baseCurrencySymbols: string[];

  constructor(props: TGetTrendsByWindowAndResolutionAndBaseCurrenciesRequest) {
    super(props);
  }
}

type TGetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint = {
  buy: number;
  sell: number;
  price: number;
};

export class GetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint
  extends AutoValidator
  implements TGetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint
{
  @IsInt()
  @IsPositive()
  @IsOptional()
  buy: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  sell: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  price: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format timestamp',
  })
  timestamp: Date;

  constructor(
    props: TGetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint,
  ) {
    super(props);
  }
}

type TGetTrendsByWindowAndResolutionAndBaseCurrenciesResponseItem = {
  points: TGetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint[];
  quoteCurrencySymbol: Currency['symbol'];
  quoteCurrencyDecimal: Currency['decimal'];
  quoteCurrencyTitle: Currency['title'];
  baseCurrencySymbol: Currency['symbol'];
  baseCurrencyDecimal: Currency['decimal'];
  baseCurrencyTitle: Currency['title'];
};

export class GetTrendsByWindowAndResolutionAndBaseCurrenciesResponseItem
  extends AutoValidator
  implements TGetTrendsByWindowAndResolutionAndBaseCurrenciesResponseItem
{
  @ValidateNested({ each: true })
  @Type(() => GetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint)
  points: GetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint[];

  @IsString()
  quoteCurrencySymbol: string;

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: number;

  @IsString()
  quoteCurrencyTitle: string;

  @IsString()
  baseCurrencySymbol: string;

  @IsInt()
  @Min(0)
  baseCurrencyDecimal: number;

  @IsString()
  baseCurrencyTitle: string;

  constructor(
    props: TGetTrendsByWindowAndResolutionAndBaseCurrenciesResponseItem,
  ) {
    super(
      Object.assign({}, props, {
        points: props.points.map(
          (item) =>
            new GetTrendsByWindowAndResolutionAndBaseCurrenciesResponsePoint(
              item,
            ),
        ),
      }),
    );
  }
}

export type GetTrendsByWindowAndResolutionAndBaseCurrenciesResponse =
  GetTrendsByWindowAndResolutionAndBaseCurrenciesResponseItem[];

export class GetTrendsByWindowAndResolutionAndBaseCurrenciesController {
  private usecase: UseCase;

  constructor(
    private readonly logger: Logger,
    quotationTrendRepository: QuotationTrendRepository,
    streamPairRepository: StreamPairRepository,
    operationService: OperationService,
    private readonly operationCurrencySymbol: string,
  ) {
    this.logger = logger.child({
      context: GetTrendsByWindowAndResolutionAndBaseCurrenciesController.name,
    });

    this.usecase = new UseCase(
      logger,
      quotationTrendRepository,
      streamPairRepository,
      operationService,
    );
  }

  async execute(
    request: GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest,
  ): Promise<GetTrendsByWindowAndResolutionAndBaseCurrenciesResponse> {
    this.logger.debug('Get trends by baseCurrency request.', { request });

    const { window, resolution } = request;
    const baseCurrencies = request.baseCurrencySymbols.map(
      (symbol) => new CurrencyEntity({ symbol }),
    );
    const quoteCurrency = new CurrencyEntity({
      symbol: this.operationCurrencySymbol,
    });

    const result = await this.usecase.execute(
      window,
      resolution,
      baseCurrencies,
      quoteCurrency,
    );

    const response = result.map(
      (item) =>
        new GetTrendsByWindowAndResolutionAndBaseCurrenciesResponseItem({
          points: item.points,
          quoteCurrencySymbol: item.quoteCurrency.symbol,
          quoteCurrencyDecimal: item.quoteCurrency.decimal,
          quoteCurrencyTitle: item.quoteCurrency.title,
          baseCurrencySymbol: item.baseCurrency.symbol,
          baseCurrencyDecimal: item.baseCurrency.decimal,
          baseCurrencyTitle: item.baseCurrency.title,
        }),
    );

    this.logger.debug('Get trends by baseCurrency response.', { response });

    return response;
  }
}
