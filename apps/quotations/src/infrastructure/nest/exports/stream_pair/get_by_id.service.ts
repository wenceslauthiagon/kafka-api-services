import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetStreamPairByIdKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  GetStreamPairByIdRequest,
  GetStreamPairByIdResponse,
} from '@zro/quotations/interface';

/**
 * Get quotation.
 */
const SERVICE = KAFKA_TOPICS.STREAM_PAIR.GET_BY_ID;

@KafkaSubscribeService(SERVICE)
export class GetStreamPairByIdServiceKafka {
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
      context: GetStreamPairByIdServiceKafka.name,
    });
  }

  /**
   * Call quotation microservice
   * @param payload Data.
   */
  async execute(
    payload: GetStreamPairByIdRequest,
  ): Promise<GetStreamPairByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetStreamPairByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get quotation message.', { data });

    // Call quotation microservice.
    const result = await this.kafkaService.send<
      GetStreamPairByIdResponse,
      GetStreamPairByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Get quotation response.', { result });

    return result;
  }
}
