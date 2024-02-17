import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetPixDepositByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDepositByIdRequest,
  GetPixDepositByIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEPOSIT.GET_BY_ID;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetPixDepositByIdServiceKafka {
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
      context: GetPixDepositByIdServiceKafka.name,
    });
  }

  /**
   * Call payments microservice to GetPixDepositById.
   * @param payload Data.
   */
  async execute(
    payload: GetPixDepositByIdRequest,
  ): Promise<GetPixDepositByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetPixDepositByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send pixDeposit message.', { data });

    // Call GetPixDepositById Payment microservice.
    const result = await this.kafkaService.send<
      GetPixDepositByIdResponse,
      GetPixDepositByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received pixDeposit message.', { result });

    return result;
  }
}
