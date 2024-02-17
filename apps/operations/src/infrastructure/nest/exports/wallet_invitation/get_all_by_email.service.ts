import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllWalletInvitationByEmailKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetAllWalletInvitationByEmailRequest,
  GetAllWalletInvitationByEmailResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_INVITATION.GET_ALL_BY_EMAIL;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllWalletInvitationByEmailServiceKafka {
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
      context: GetAllWalletInvitationByEmailServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllWalletInvitationByEmailRequest,
  ): Promise<GetAllWalletInvitationByEmailResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllWalletInvitationByEmailKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send get wallet invitation by email.', {
      data,
    });

    // Call get walletInvitation microservice.
    const result = await this.kafkaService.send<
      GetAllWalletInvitationByEmailResponse,
      GetAllWalletInvitationByEmailKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get wallet invitation by email message.', {
      result,
    });

    return result;
  }
}
