import { Logger } from 'winston';
import { IsUUID, IsOptional, IsString, IsPositive } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  StreamPairRepository,
  StreamQuotationGateway,
  StreamQuotationGatewayRepository,
} from '@zro/quotations/domain';
import {
  CreateStreamQuotationGatewayUseCase,
  GetStreamQuotationGateway,
  OperationService,
} from '@zro/quotations/application';

type TCreateStreamQuotationGatewayResponse = Omit<
  StreamQuotationGateway,
  'isSynthetic' | 'baseCurrency' | 'quoteCurrency' | 'timestamp'
> & {
  baseCurrencySymbol: Currency['symbol'];
  quoteCurrencySymbol: Currency['symbol'];
};

export class CreateStreamQuotationGatewayResponse
  extends AutoValidator
  implements TCreateStreamQuotationGatewayResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  baseCurrencySymbol: string;

  @IsString()
  quoteCurrencySymbol: string;

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

  constructor(props: TCreateStreamQuotationGatewayResponse) {
    super(props);
  }
}

export class CreateStreamQuotationGatewayController {
  private usecase: CreateStreamQuotationGatewayUseCase;

  constructor(
    private logger: Logger,
    streamQuotationGatewayRepository: StreamQuotationGatewayRepository,
    streamPairRepository: StreamPairRepository,
    operationService: OperationService,
    streamQuotationGateway: GetStreamQuotationGateway,
  ) {
    this.logger = logger.child({
      context: CreateStreamQuotationGatewayController.name,
    });
    this.usecase = new CreateStreamQuotationGatewayUseCase(
      this.logger,
      streamQuotationGatewayRepository,
      streamPairRepository,
      operationService,
      streamQuotationGateway,
    );
  }

  async execute(): Promise<CreateStreamQuotationGatewayResponse[]> {
    this.logger.debug('Create streamQuotationGateway request.');

    const createStreamQuotationGateway = await this.usecase.execute();

    const response = createStreamQuotationGateway.map(
      (quotation) =>
        new CreateStreamQuotationGatewayResponse({
          id: quotation.id,
          buy: quotation.buy,
          sell: quotation.sell,
          amount: quotation.amount,
          gatewayName: quotation.gatewayName,
          baseCurrencySymbol: quotation.baseCurrency.symbol,
          quoteCurrencySymbol: quotation.quoteCurrency.symbol,
        }),
    );

    this.logger.debug('Create streamQuotationGateway response.', { response });

    return response;
  }
}
