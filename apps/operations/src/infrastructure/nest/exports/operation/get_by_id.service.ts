import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOperationByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetOperationByIdRequest,
  GetOperationByIdResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.OPERATION.GET_BY_ID;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetOperationByIdServiceKafka {
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
    this.logger = logger.child({ context: GetOperationByIdServiceKafka.name });
  }

  /**
   * Call operations microservice to getById.
   * @param payload Data.
   */
  async execute(
    payload: GetOperationByIdRequest,
  ): Promise<GetOperationByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get operation by id payload.', { payload });

    // Request Kafka message.
    // FIXME: Mudar o get operation by id request para enviar o user id
    const data: GetOperationByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      GetOperationByIdResponse,
      GetOperationByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get operation by id message.', { result });

    return result;
  }
}
