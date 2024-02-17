import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ManuallyCloseRemittanceKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import {
  ManuallyCloseRemittanceResponse,
  ManuallyCloseRemittanceRequest,
} from '@zro/otc/interface';

/**
 * Close remittance microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.REMITTANCE.MANUALLY_CLOSE_REMITTANCE])
export class ManuallyCloseRemittanceServiceKafka {
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
      context: ManuallyCloseRemittanceServiceKafka.name,
    });
  }

  /**
   * Call manually close remittance microservice.
   * @param payload close remittance data.
   * @returns Closed remittance.
   */
  async execute(
    payload: ManuallyCloseRemittanceRequest,
  ): Promise<ManuallyCloseRemittanceResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ManuallyCloseRemittanceKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send close remittance message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      ManuallyCloseRemittanceResponse,
      ManuallyCloseRemittanceKafkaRequest
    >(KAFKA_TOPICS.REMITTANCE.MANUALLY_CLOSE_REMITTANCE, data);

    logger.debug('Received message.', { result });

    return result;
  }
}
