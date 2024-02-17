import { Logger } from 'winston';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsDefined,
  IsPositive,
  IsDate,
  IsArray,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  StreamPair,
  StreamPairRepository,
  StreamQuotation,
  StreamQuotationGatewayRepository,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import {
  CreateStreamQuotationUseCase,
  OperationService,
} from '@zro/quotations/application';
import {
  StreamQuotationEventEmitterController,
  StreamQuotationEventEmitterControllerInterface,
} from '@zro/quotations/interface';

type TCreateStreamQuotationResponse = Omit<StreamQuotation, 'isSynthetic'>;

export class CreateStreamQuotationResponse
  extends AutoValidator
  implements TCreateStreamQuotationResponse
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

  constructor(props: TCreateStreamQuotationResponse) {
    super(props);
  }
}

export class CreateStreamQuotationController {
  private usecase: CreateStreamQuotationUseCase;

  constructor(
    private logger: Logger,
    streamQuotationGatewayRepository: StreamQuotationGatewayRepository,
    streamQuotationRepository: StreamQuotationRepository,
    streamPairRepository: StreamPairRepository,
    operationService: OperationService,
    serviceEventEmitter: StreamQuotationEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateStreamQuotationController.name,
    });

    const eventEmitter = new StreamQuotationEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new CreateStreamQuotationUseCase(
      this.logger,
      streamQuotationGatewayRepository,
      streamQuotationRepository,
      streamPairRepository,
      operationService,
      eventEmitter,
    );
  }

  async execute(): Promise<CreateStreamQuotationResponse[]> {
    this.logger.debug('Create streamQuotation request.');

    const result = await this.usecase.execute();

    const response = result.map(
      (quotation) =>
        new CreateStreamQuotationResponse({
          id: quotation.id,
          baseCurrency: quotation.baseCurrency,
          quoteCurrency: quotation.quoteCurrency,
          buy: quotation.buy,
          sell: quotation.sell,
          amount: quotation.amount,
          gatewayName: quotation.gatewayName,
          timestamp: quotation.timestamp,
          composedBy: quotation.composedBy,
          streamPair: quotation.streamPair,
        }),
    );

    this.logger.debug('Create streamQuotation response.', {
      streamQuotation: response,
    });

    return response;
  }
}
