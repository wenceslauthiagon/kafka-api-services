import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateCashOutSolicitationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-zro-pay/infrastructure';

import {
  CreateCashOutSolicitationRequest,
  CreateCashOutSolicitationResponse,
} from '@zro/pix-zro-pay/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.CASHOUT_SOLICITATION.CREATE;

/**
 * CreateCashOutSolicitation microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateCashOutSolicitationServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: CreateCashOutSolicitationServiceKafka.name,
    });
  }

  /**
   * Call CreateCashOutSolicitation microservice to create a cashOutSolicitation.
   * @param payload Data.
   */
  async execute(
    payload: CreateCashOutSolicitationRequest,
  ): Promise<CreateCashOutSolicitationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateCashOutSolicitationKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send cashOutSolicitation message.', { data });

    // Call create CreatecashOutSolicitation microservice.
    const result = await this.kafkaService.send<
      CreateCashOutSolicitationResponse,
      CreateCashOutSolicitationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received cashOutSolicitation message.', { result });

    return result;
  }
}
