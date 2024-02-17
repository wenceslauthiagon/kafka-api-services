import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ApprovePixDepositKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  ApprovePixDepositRequest,
  ApprovePixDepositResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEPOSIT.APPROVE;

/**
 * Service to call pix-payments microservice to approve pix deposit.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class ApprovePixDepositServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: ApprovePixDepositServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to approve pix deposit.
   * @param payload Data.
   */
  async execute(
    payload: ApprovePixDepositRequest,
  ): Promise<ApprovePixDepositResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ApprovePixDepositKafkaRequest = {
      key: `${payload.operationId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send approve pix deposit request message.', { data });

    // Call pix-payments microservice to approve pix deposit.
    const result = await this.kafkaService.send<
      ApprovePixDepositResponse,
      ApprovePixDepositKafkaRequest
    >(SERVICE, data);

    logger.debug('Received approve pix deposit message.', { result });

    return result;
  }
}
