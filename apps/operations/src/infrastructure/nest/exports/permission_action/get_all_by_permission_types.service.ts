import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPermissionActionByPermissionTypesKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllPermissionActionByPermissionTypesRequest,
  GetAllPermissionActionByPermissionTypesResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.PERMISSION_ACTION.GET_ALL_BY_PERMISSION_TYPES;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPermissionActionByPermissionTypesServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetAllPermissionActionByPermissionTypesServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get permission action by permission types.
   * @param payload Data.
   */
  async execute(
    payload: GetAllPermissionActionByPermissionTypesRequest,
  ): Promise<GetAllPermissionActionByPermissionTypesResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get permission action by permission types payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetAllPermissionActionByPermissionTypesKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get permission action by permission types microservice.
    const result = await this.kafkaService.send<
      GetAllPermissionActionByPermissionTypesResponse,
      GetAllPermissionActionByPermissionTypesKafkaRequest
    >(SERVICE, data);

    logger.debug(
      'Received get permission action by permission types message.',
      { total: result.total },
    );

    return result;
  }
}
