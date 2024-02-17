import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  AcceptOperationRequest,
  AcceptOperationResponse,
} from '@zro/operations/interface';
import {
  AcceptOperationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';

// Service topic.
const SERVICE = KAFKA_TOPICS.OPERATION.ACCEPT;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class AcceptOperationServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: AcceptOperationServiceKafka.name });
  }

  /**
   * Call operations microservice to accept.
   * @param payload Data.
   */
  async execute(
    payload: AcceptOperationRequest,
  ): Promise<AcceptOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send accept operation payload.', { payload });

    // Request Kafka message.
    // FIXME: Mudar o accept operation request para enviar o user id também (owner e beneficiary)
    const data: AcceptOperationKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      AcceptOperationResponse,
      AcceptOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received accepted operation message.', { result });

    return result;
  }
}
