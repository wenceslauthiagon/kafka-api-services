import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetOperationReceiptByUserAndWalletAndIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetOperationReceiptByUserAndWalletAndIdRequest,
  GetOperationReceiptByUserAndWalletAndIdResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.OPERATION.GET_RECEIPT_BY_USER_AND_WALLET_AND_ID;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetOperationReceiptByUserAndWalletAndIdServiceKafka {
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
      context: GetOperationReceiptByUserAndWalletAndIdServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get receipt.
   * @param payload Data.
   */
  async execute(
    payload: GetOperationReceiptByUserAndWalletAndIdRequest,
  ): Promise<GetOperationReceiptByUserAndWalletAndIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get operation receipt payload.', { payload });

    const data: GetOperationReceiptByUserAndWalletAndIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call operation microservice.
    const result = await this.kafkaService.send<
      GetOperationReceiptByUserAndWalletAndIdResponse,
      GetOperationReceiptByUserAndWalletAndIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get operation receipt message.', { result });

    return result;
  }
}
