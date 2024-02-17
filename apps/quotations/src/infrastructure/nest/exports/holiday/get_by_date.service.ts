import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetHolidayByDateKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  GetHolidayByDateRequest,
  GetHolidayByDateResponse,
} from '@zro/quotations/interface';

/**
 * Get holiday by date.
 */
const SERVICE = KAFKA_TOPICS.HOLIDAY.GET_BY_DATE;

@KafkaSubscribeService(SERVICE)
export class GetHolidayByDateServiceKafka {
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
    this.logger = logger.child({ context: GetHolidayByDateServiceKafka.name });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetHolidayByDateRequest,
  ): Promise<GetHolidayByDateResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetHolidayByDateKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get holiday message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetHolidayByDateResponse,
      GetHolidayByDateKafkaRequest
    >(SERVICE, data);

    logger.debug('Get holiday result.', { result });

    return result;
  }
}
