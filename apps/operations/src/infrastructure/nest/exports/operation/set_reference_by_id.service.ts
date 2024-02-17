import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  SetOperationReferenceByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  SetOperationReferenceByIdRequest,
  SetOperationReferenceByIdResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.OPERATION.SET_REFERENCE_BY_ID;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class SetOperationReferenceByIdServiceKafka {
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
      context: SetOperationReferenceByIdServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to set reference by id.
   * @param payload Data.
   */
  async execute(
    payload: SetOperationReferenceByIdRequest,
  ): Promise<SetOperationReferenceByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send set reference by id payload.', { payload });

    // Request Kafka message.
    const data: SetOperationReferenceByIdKafkaRequest = {
      key: `${payload.operationIdFirst}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call Operations microservice.
    const result = await this.kafkaService.send<
      SetOperationReferenceByIdResponse,
      SetOperationReferenceByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received set reference by id message.', { result });

    return result;
  }
}
