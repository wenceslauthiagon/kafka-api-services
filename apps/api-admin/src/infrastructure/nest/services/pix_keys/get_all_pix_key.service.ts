import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  GetAllPixKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-keys/infrastructure';
import {
  GetAllPixKeyRequest,
  GetAllPixKeyResponse,
} from '@zro/pix-keys/interface';

/**
 * PixKey microservice.
 */
@Injectable()
export class GetAllPixKeyServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: GetAllPixKeyServiceKafka.name,
    });
    this.kafkaService.subscribe([KAFKA_TOPICS.KEY.GET_ALL]);
  }

  /**
   * Call pixKeys microservice to get all pix key
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: GetAllPixKeyRequest,
  ): Promise<GetAllPixKeyResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: GetAllPixKeyKafkaRequest = {
      key: `${payload.userId ?? requestId}`,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Send pixKeys message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      GetAllPixKeyResponse,
      GetAllPixKeyKafkaRequest
    >(KAFKA_TOPICS.KEY.GET_ALL, data);

    logger.debug('Received pixKeys message.', { result });

    return result;
  }
}
