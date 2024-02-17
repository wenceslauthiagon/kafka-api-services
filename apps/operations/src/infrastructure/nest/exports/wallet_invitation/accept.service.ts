import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  AcceptWalletInvitationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  AcceptWalletInvitationRequest,
  AcceptWalletInvitationResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_INVITATION.ACCEPT;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class AcceptWalletInvitationServiceKafka {
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
      context: AcceptWalletInvitationServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to accept.
   * @param payload Data.
   */
  async execute(
    payload: AcceptWalletInvitationRequest,
  ): Promise<AcceptWalletInvitationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: AcceptWalletInvitationKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send accept wallet invitation.', { data });

    // Call accept walletInvitation microservice.
    const result = await this.kafkaService.send<
      AcceptWalletInvitationResponse,
      AcceptWalletInvitationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received accept wallet invitation message.', {
      result,
    });

    return result;
  }
}
