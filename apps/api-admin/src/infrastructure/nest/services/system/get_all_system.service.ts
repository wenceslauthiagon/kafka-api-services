import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  GetAllSystemKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import { GetAllSystemRequest, GetAllSystemResponse } from '@zro/otc/interface';

/**
 * System microservice.
 */
@Injectable()
export class GetAllSystemServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetAllSystemServiceKafka.name });
    this.kafkaService.subscribe([KAFKA_TOPICS.SYSTEM.GET_ALL]);
  }

  /**
   * Call systems microservice to getAll.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: GetAllSystemRequest,
  ): Promise<GetAllSystemResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: GetAllSystemKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: payload,
    };
    logger.debug('Send system message.');

    // Call getAll System microservice.
    const result = await this.kafkaService.send<
      GetAllSystemResponse,
      GetAllSystemKafkaRequest
    >(KAFKA_TOPICS.SYSTEM.GET_ALL, data);

    logger.debug('Received system message.', result);

    return result;
  }
}
