import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllConversionRequest,
  GetAllConversionResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  GetAllConversionKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * GetAll Conversion.
 */
const SERVICE = KAFKA_TOPICS.CONVERSION.GET_ALL;

@KafkaSubscribeService(SERVICE)
export class GetAllConversionServiceKafka {
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
      context: GetAllConversionServiceKafka.name,
    });
  }

  /**
   * Call systems microservice
   * @param payload Data.
   */
  async execute(
    payload: GetAllConversionRequest,
  ): Promise<GetAllConversionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllConversionKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('GetAll conversion message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetAllConversionResponse,
      GetAllConversionKafkaRequest
    >(SERVICE, data);

    logger.debug('Get All conversion result.', result);

    return result;
  }
}
