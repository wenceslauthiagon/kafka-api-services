import { Logger } from 'winston';
import {
  IsArray,
  IsDate,
  IsDefined,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  StreamPair,
  StreamQuotation,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import { GetStreamQuotationByBaseCurrencyUseCase } from '@zro/quotations/application';

type TGetStreamQuotationByBaseCurrencyRequest = {
  baseCurrencySymbol: Currency['symbol'];
};

export class GetStreamQuotationByBaseCurrencyRequest
  extends AutoValidator
  implements TGetStreamQuotationByBaseCurrencyRequest
{
  @IsString()
  @MaxLength(255)
  baseCurrencySymbol: string;

  constructor(props: TGetStreamQuotationByBaseCurrencyRequest) {
    super(props);
  }
}

type TGetStreamQuotationByBaseCurrencyResponse = Omit<
  StreamQuotation,
  'isSynthetic'
>;

export class GetStreamQuotationByBaseCurrencyResponse
  extends AutoValidator
  implements TGetStreamQuotationByBaseCurrencyResponse
{
  @IsUUID(4)
  id: string;

  @IsDefined()
  baseCurrency: Currency;

  @IsDefined()
  quoteCurrency: Currency;

  @IsOptional()
  @IsPositive()
  buy: number;

  @IsOptional()
  @IsPositive()
  sell: number;

  @IsOptional()
  @IsPositive()
  amount: number;

  @IsString()
  gatewayName: string;

  @IsDate()
  timestamp: Date;

  @IsOptional()
  @IsArray()
  composedBy?: StreamQuotation[];

  @IsDefined()
  streamPair: StreamPair;

  constructor(props: TGetStreamQuotationByBaseCurrencyResponse) {
    super(props);
  }
}

export class GetStreamQuotationByBaseCurrencyController {
  private usecase: GetStreamQuotationByBaseCurrencyUseCase;

  constructor(
    private logger: Logger,
    streamQuotationRepository: StreamQuotationRepository,
    operationCurrencySymbol: string,
  ) {
    this.logger = logger.child({
      context: GetStreamQuotationByBaseCurrencyController.name,
    });

    this.usecase = new GetStreamQuotationByBaseCurrencyUseCase(
      logger,
      streamQuotationRepository,
      operationCurrencySymbol,
    );
  }

  async execute(
    request: GetStreamQuotationByBaseCurrencyRequest,
  ): Promise<GetStreamQuotationByBaseCurrencyResponse> {
    this.logger.debug('Get stream quotation request.', { request });

    const { baseCurrencySymbol } = request;
    const baseCurrency = new CurrencyEntity({ symbol: baseCurrencySymbol });

    const result = await this.usecase.execute(baseCurrency);

    if (!result) return null;

    const response = new GetStreamQuotationByBaseCurrencyResponse({
      id: result.id,
      baseCurrency: result.baseCurrency,
      quoteCurrency: result.quoteCurrency,
      buy: result.buy,
      sell: result.sell,
      amount: result.amount,
      gatewayName: result.gatewayName,
      timestamp: result.timestamp,
      composedBy: result.composedBy,
      streamPair: result.streamPair,
    });

    this.logger.debug('Get stream quotation response.', { response });

    return response;
  }
}
