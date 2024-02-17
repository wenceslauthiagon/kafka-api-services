import { Logger } from 'winston';
import {
  StreamPair,
  StreamQuotation,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import { AutoValidator } from '@zro/common';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsDefined,
  IsPositive,
  IsDate,
  IsArray,
} from 'class-validator';

import { GetStreamQuotationByBaseAndQuoteAndGatewayNameUseCase } from '@zro/quotations/application';
import { Currency, CurrencyEntity } from '@zro/operations/domain';

type TGetStreamQuotationByBaseAndQuoteAndGatewayNameRequest = Pick<
  StreamQuotation,
  'gatewayName'
> & {
  baseCurrencySymbol: Currency['symbol'];
  quoteCurrencySymbol: Currency['symbol'];
};

export class GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest
  extends AutoValidator
  implements TGetStreamQuotationByBaseAndQuoteAndGatewayNameRequest
{
  @IsString()
  baseCurrencySymbol: string;

  @IsString()
  quoteCurrencySymbol: string;

  @IsString()
  gatewayName: string;

  constructor(props: TGetStreamQuotationByBaseAndQuoteAndGatewayNameRequest) {
    super(props);
  }
}

type TGetStreamQuotationByBaseAndQuoteAndGatewayNameResponse = Omit<
  StreamQuotation,
  'isSynthetic'
>;

export class GetStreamQuotationByBaseAndQuoteAndGatewayNameResponse
  extends AutoValidator
  implements TGetStreamQuotationByBaseAndQuoteAndGatewayNameResponse
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

  constructor(props: TGetStreamQuotationByBaseAndQuoteAndGatewayNameResponse) {
    super(props);
  }
}

export class GetStreamQuotationByBaseAndQuoteAndGatewayNameController {
  private usecase: GetStreamQuotationByBaseAndQuoteAndGatewayNameUseCase;

  constructor(
    private logger: Logger,
    private readonly streamQuotationRepository: StreamQuotationRepository,
  ) {
    this.logger = logger.child({
      context: GetStreamQuotationByBaseAndQuoteAndGatewayNameController.name,
    });
    this.usecase = new GetStreamQuotationByBaseAndQuoteAndGatewayNameUseCase(
      this.logger,
      this.streamQuotationRepository,
    );
  }

  async execute(
    request: GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest,
  ): Promise<GetStreamQuotationByBaseAndQuoteAndGatewayNameResponse> {
    this.logger.debug('Create streamQuotation request.');

    const { baseCurrencySymbol, quoteCurrencySymbol, gatewayName } = request;

    const baseCurrency = new CurrencyEntity({
      symbol: baseCurrencySymbol,
    });

    const quoteCurrency = new CurrencyEntity({
      symbol: quoteCurrencySymbol,
    });

    const response = await this.usecase.execute(
      baseCurrency,
      quoteCurrency,
      gatewayName,
    );

    if (!response) return null;

    return new GetStreamQuotationByBaseAndQuoteAndGatewayNameResponse(response);
  }
}
