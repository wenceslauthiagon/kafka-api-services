import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAdminByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/admin/infrastructure';
import {
  GetAdminByIdRequest,
  GetAdminByIdResponse,
} from '@zro/admin/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ADMIN.GET_BY_ID;

/**
 * Admin microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAdminByIdServiceKafka {
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
      context: GetAdminByIdServiceKafka.name,
    });
  }

  /**
   * Call admin microservice to get admin by id.
   * @param payload Data.
   */
  async execute(payload: GetAdminByIdRequest): Promise<GetAdminByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAdminByIdKafkaRequest = {
      key: `${payload.id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get admin by id message.', { data });

    // Call create Report Operation message.
    const result = await this.kafkaService.send<
      GetAdminByIdResponse,
      GetAdminByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Get admin by id response.', result);

    return result;
  }
}
