import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  UpdateHolidayByIdKafkaRequest,
} from '@zro/quotations/infrastructure';
import {
  UpdateHolidayByIdRequest,
  UpdateHolidayByIdResponse,
} from '@zro/quotations/interface';

/**
 * Update holiday by id.
 */
const SERVICE = KAFKA_TOPICS.HOLIDAY.UPDATE_BY_ID;

@KafkaSubscribeService(SERVICE)
export class UpdateHolidayByIdServiceKafka {
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
    this.logger = logger.child({ context: UpdateHolidayByIdServiceKafka.name });
  }

  /**
   * Call update holiday kafka.
   * @param payload Update holiday data.
   * @returns Updated holiday.
   */
  async execute(
    payload: UpdateHolidayByIdRequest,
  ): Promise<UpdateHolidayByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: UpdateHolidayByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Update holiday message.', { data });

    // Call quotations microservice.
    const result = await this.kafkaService.send<
      UpdateHolidayByIdResponse,
      UpdateHolidayByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Update holiday result.', { result });

    return result;
  }
}
