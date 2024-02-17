import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import {
  OperationService,
  GetCurrencyByIdServiceRequest,
  GetCurrencyByIdServiceResponse,
} from '@zro/otc-bot/application';
import { GetCurrencyByIdRequest } from '@zro/operations/interface';
import { GetCurrencyByIdServiceKafka } from '@zro/operations/infrastructure';

/**
 * Operation microservice
 */
export class OperationServiceKafka implements OperationService {
  static _services: any[] = [GetCurrencyByIdServiceKafka];

  private readonly getCurrencyByIdService: GetCurrencyByIdServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: OperationServiceKafka.name });

    this.getCurrencyByIdService = new GetCurrencyByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  async getCurrencyById(
    request: GetCurrencyByIdServiceRequest,
  ): Promise<GetCurrencyByIdServiceResponse> {
    const remote = new GetCurrencyByIdRequest({
      id: request.id,
    });

    const response = await this.getCurrencyByIdService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      symbol: response.symbol,
      decimal: response.decimal,
      state: response.state,
      symbolAlign: response.symbolAlign,
      title: response.title,
      type: response.type,
    };
  }
}
