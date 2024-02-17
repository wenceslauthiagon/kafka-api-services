import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateAndAcceptOperationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  CreateAndAcceptOperationRequest,
  CreateAndAcceptOperationResponse,
} from '@zro/operations/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.OPERATION.CREATE_AND_ACCEPT;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateAndAcceptOperationServiceKafka {
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
    this.logger = logger.child({
      context: CreateAndAcceptOperationServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to create and accept.
   * @param payload Data.
   */
  async execute(
    payload: CreateAndAcceptOperationRequest,
  ): Promise<CreateAndAcceptOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send create operation payload.', { payload });

    // Request Kafka message.
    const data: CreateAndAcceptOperationKafkaRequest = {
      key: `${payload.owner?.walletId ?? payload.beneficiary?.walletId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      CreateAndAcceptOperationResponse,
      CreateAndAcceptOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received created operation message.', { result });

    return result;
  }
}
