import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetConversionCreditByUserRequest,
  GetConversionCreditByUserResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetConversionCreditByUserKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Get by user Conversion credit.
 */
const SERVICE = KAFKA_TOPICS.CONVERSION_CREDIT.GET_BY_USER;

@KafkaSubscribeService(SERVICE)
export class GetConversionCreditByUserServiceKafka {
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
      context: GetConversionCreditByUserServiceKafka.name,
    });
  }

  /**
   * Call systems microservice
   * @param payload Data.
   */
  async execute(
    payload: GetConversionCreditByUserRequest,
  ): Promise<GetConversionCreditByUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetConversionCreditByUserKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get conversion credit message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetConversionCreditByUserResponse,
      GetConversionCreditByUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Get conversion credit message.', result);

    return result;
  }
}
