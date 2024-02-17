import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllRemittanceRequest,
  GetAllRemittanceResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetAllRemittanceKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * GetAll Remittance.
 */
const SERVICE = KAFKA_TOPICS.REMITTANCE.GET_ALL;

@KafkaSubscribeService(SERVICE)
export class GetAllRemittanceServiceKafka {
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
      context: GetAllRemittanceServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetAllRemittanceRequest,
  ): Promise<GetAllRemittanceResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllRemittanceKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('GetAll remittance message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetAllRemittanceResponse,
      GetAllRemittanceKafkaRequest
    >(SERVICE, data);

    logger.debug('GetAll remittance message.', result);

    return result;
  }
}
