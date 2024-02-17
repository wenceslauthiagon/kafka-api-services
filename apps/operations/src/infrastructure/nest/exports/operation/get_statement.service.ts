import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetStatementKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetStatementRequest,
  GetStatementResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.OPERATION.GET_STATEMENT;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetStatementServiceKafka {
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
      context: GetStatementServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get statement.
   * @param payload Data.
   */
  async execute(payload: GetStatementRequest): Promise<GetStatementResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get statement payload.', { payload });

    // Request Kafka message.
    const data: GetStatementKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      GetStatementResponse,
      GetStatementKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get statement message.', { result });

    return result;
  }
}
