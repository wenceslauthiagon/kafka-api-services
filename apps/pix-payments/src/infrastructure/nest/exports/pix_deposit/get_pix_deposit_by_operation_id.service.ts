import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPixDepositByOperationIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDepositByOperationIdRequest,
  GetPixDepositByOperationIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEPOSIT.GET_BY_OPERATION_ID;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPixDepositByOperationIdServiceKafka {
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
      context: GetPixDepositByOperationIdServiceKafka.name,
    });
  }

  /**
   * Call payments microservice to GetPixDepositByOperationId.
   * @param payload Data.
   */
  async execute(
    payload: GetPixDepositByOperationIdRequest,
  ): Promise<GetPixDepositByOperationIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPixDepositByOperationIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send pixDeposit message.', { data });

    // Call GetPixDepositByOperationId Payment microservice.
    const result = await this.kafkaService.send<
      GetPixDepositByOperationIdResponse,
      GetPixDepositByOperationIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixDeposit message.', { result });

    return result;
  }
}
