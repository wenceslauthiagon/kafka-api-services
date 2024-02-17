import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetHistoryPixKeyKafkaRequest,
} from '@zro/pix-keys/infrastructure';
import {
  GetHistoryPixKeyRequest,
  GetHistoryPixKeyResponse,
} from '@zro/pix-keys/interface';

/**
 * PixKey microservice.
 */
@Injectable()
export class GetHistoryPixKeyServiceKafka {
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
      context: GetHistoryPixKeyServiceKafka.name,
    });
    this.kafkaService.subscribe([KAFKA_TOPICS.KEY_HISTORY.GET_ALL]);
  }

  /**
   * Call pixKeys microservice to get a pix key history
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: GetHistoryPixKeyRequest,
  ): Promise<GetHistoryPixKeyResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: GetHistoryPixKeyKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: payload,
    };

    logger.debug('Send pixKeyHistory message.', { data });

    // Call create PixKey microservice.
    const result = await this.kafkaService.send<
      GetHistoryPixKeyResponse,
      GetHistoryPixKeyKafkaRequest
    >(KAFKA_TOPICS.KEY_HISTORY.GET_ALL, data);

    logger.debug('Received pixKeyHistory message.', { result });

    return result;
  }
}
