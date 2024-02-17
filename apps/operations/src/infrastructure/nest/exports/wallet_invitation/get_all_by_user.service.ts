import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllWalletInvitationByUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllWalletInvitationByUserRequest,
  GetAllWalletInvitationByUserResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_INVITATION.GET_ALL_BY_USER;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllWalletInvitationByUserServiceKafka {
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
      context: GetAllWalletInvitationByUserServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllWalletInvitationByUserRequest,
  ): Promise<GetAllWalletInvitationByUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllWalletInvitationByUserKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send get wallet invitation by user.', { data });

    // Call get walletInvitation microservice.
    const result = await this.kafkaService.send<
      GetAllWalletInvitationByUserResponse,
      GetAllWalletInvitationByUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get wallet invitation by user message.', { result });

    return result;
  }
}
