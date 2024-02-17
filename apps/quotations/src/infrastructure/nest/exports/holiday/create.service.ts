import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  CreateHolidayKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  CreateHolidayRequest,
  CreateHolidayResponse,
} from '@zro/quotations/interface';

/**
 * Create Holiday.
 */
const SERVICE = KAFKA_TOPICS.HOLIDAY.CREATE;

@KafkaSubscribeService(SERVICE)
export class CreateHolidayServiceKafka {
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
    this.logger = logger.child({ context: CreateHolidayServiceKafka.name });
  }

  /**
   * Call quotations microservice
   * @param payload Data.
   */
  async execute(payload: CreateHolidayRequest): Promise<CreateHolidayResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateHolidayKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create holiday message.', { data });

    // Call quotations microservice.
    const result = await this.kafkaService.send<
      CreateHolidayResponse,
      CreateHolidayKafkaRequest
    >(SERVICE, data);

    logger.debug('Create holiday result.', { result });

    return result;
  }
}
