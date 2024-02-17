import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOperationByUserAndWalletAndIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetOperationByUserAndWalletAndIdRequest,
  GetOperationByUserAndWalletAndIdResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.OPERATION.GET_BY_USER_AND_WALLET_AND_ID;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetOperationByUserAndWalletAndIdServiceKafka {
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
      context: GetOperationByUserAndWalletAndIdServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get by id.
   * @param payload Data.
   */
  async execute(
    payload: GetOperationByUserAndWalletAndIdRequest,
  ): Promise<GetOperationByUserAndWalletAndIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get all operations payload.', { payload });

    // Request Kafka message.
    const data: GetOperationByUserAndWalletAndIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      GetOperationByUserAndWalletAndIdResponse,
      GetOperationByUserAndWalletAndIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get operations message.', { result });

    return result;
  }
}
