import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllCashOutSolicitationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-zro-pay/infrastructure';
import {
  GetAllCashOutSolicitationRequest,
  GetAllCashOutSolicitationResponse,
} from '@zro/pix-zro-pay/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.CASHOUT_SOLICITATION.GET_ALL;

/**
 * GetAllCashOutSolicitation microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllCashOutSolicitationServiceKafka {
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
      context: GetAllCashOutSolicitationServiceKafka.name,
    });
  }

  /**
   * Call GetAllCashOutSolicitation microservice to get a GetAllCashOutSolicitation.
   * @param payload Data.
   */
  async execute(
    payload: GetAllCashOutSolicitationRequest,
  ): Promise<GetAllCashOutSolicitationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllCashOutSolicitationKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send GetAllCashOutSolicitation message.', { data });

    // Call GetAllCashOutSolicitation microservice.
    const result = await this.kafkaService.send<
      GetAllCashOutSolicitationResponse,
      GetAllCashOutSolicitationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received GetAllCashOutSolicitation message.', { result });

    return result;
  }
}
