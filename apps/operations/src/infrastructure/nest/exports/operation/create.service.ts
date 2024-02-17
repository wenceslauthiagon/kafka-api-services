import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateOperationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  CreateOperationRequest,
  CreateOperationResponse,
} from '@zro/operations/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.OPERATION.CREATE;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateOperationServiceKafka {
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
    this.logger = logger.child({ context: CreateOperationServiceKafka.name });
  }

  /**
   * Call operations microservice to create.
   * @param payload Data.
   */
  async execute(
    payload: CreateOperationRequest,
  ): Promise<CreateOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send create operation payload.', { payload });

    // Request Kafka message.
    const data: CreateOperationKafkaRequest = {
      key: `${payload.owner?.walletId ?? payload.beneficiary?.walletId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      CreateOperationResponse,
      CreateOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received created operation message.', { result });

    return result;
  }
}
