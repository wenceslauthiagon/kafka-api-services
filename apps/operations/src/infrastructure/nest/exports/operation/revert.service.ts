import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  RevertOperationRequest,
  RevertOperationResponse,
} from '@zro/operations/interface';
import {
  RevertOperationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';

// Service topic.
const SERVICE = KAFKA_TOPICS.OPERATION.REVERT;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class RevertOperationServiceKafka {
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
    this.logger = logger.child({ context: RevertOperationServiceKafka.name });
  }

  /**
   * Call operations microservice to revert.
   * @param payload Data.
   */
  async execute(
    payload: RevertOperationRequest,
  ): Promise<RevertOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send revert operation payload.', { payload });

    // Request Kafka message.
    // FIXME: Mudar o revert operation request para enviar o user id também (owner e beneficiary)
    const data: RevertOperationKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      RevertOperationResponse,
      RevertOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received reverted operation message.', { result });

    return result;
  }
}
