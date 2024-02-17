import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllOperationsByUserAndWalletAndFilterKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllOperationsByUserAndWalletAndFilterRequest,
  GetAllOperationsByUserAndWalletAndFilterResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.OPERATION.GET_ALL_BY_USER_AND_WALLET_AND_FILTER;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllOperationsByUserAndWalletAndFilterServiceKafka {
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
      context: GetAllOperationsByUserAndWalletAndFilterServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get all.
   * @param payload Data.
   */
  async execute(
    payload: GetAllOperationsByUserAndWalletAndFilterRequest,
  ): Promise<GetAllOperationsByUserAndWalletAndFilterResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get all operations payload.', { payload });

    // Request Kafka message.
    const data: GetAllOperationsByUserAndWalletAndFilterKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      GetAllOperationsByUserAndWalletAndFilterResponse,
      GetAllOperationsByUserAndWalletAndFilterKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get operations message.', { result });

    return result;
  }
}
