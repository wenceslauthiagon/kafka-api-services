import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetConversionByUserAndIdKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  GetConversionByUserAndIdRequest,
  GetConversionByUserAndIdResponse,
} from '@zro/otc/interface';

/**
 * Get conversion by user and id.
 */
const SERVICE = KAFKA_TOPICS.CONVERSION.GET_BY_USER_AND_ID;

@KafkaSubscribeService(SERVICE)
export class GetConversionByUserAndIdServiceKafka {
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
      context: GetConversionByUserAndIdServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetConversionByUserAndIdRequest,
  ): Promise<GetConversionByUserAndIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetConversionByUserAndIdKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get conversion by user and id message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetConversionByUserAndIdResponse,
      GetConversionByUserAndIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Get conversion by user and id result.', { result });

    return result;
  }
}
