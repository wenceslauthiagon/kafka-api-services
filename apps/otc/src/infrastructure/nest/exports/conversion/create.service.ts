import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateConversionRequest,
  CreateConversionResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CreateConversionKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Create Conversion.
 */
const SERVICE = KAFKA_TOPICS.CONVERSION.CREATE;

@KafkaSubscribeService(SERVICE)
export class CreateConversionServiceKafka {
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
      context: CreateConversionServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: CreateConversionRequest,
  ): Promise<CreateConversionResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateConversionKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create conversion message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      CreateConversionResponse,
      CreateConversionKafkaRequest
    >(SERVICE, data);

    logger.debug('Created conversion message.', result);

    return result;
  }
}
