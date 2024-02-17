import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DeclineWalletInvitationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  DeclineWalletInvitationRequest,
  DeclineWalletInvitationResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_INVITATION.DECLINE;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class DeclineWalletInvitationServiceKafka {
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
      context: DeclineWalletInvitationServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to decline.
   * @param payload Data.
   */
  async execute(
    payload: DeclineWalletInvitationRequest,
  ): Promise<DeclineWalletInvitationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: DeclineWalletInvitationKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send decline wallet invitation.', { data });

    // Call decline walletInvitation microservice.
    const result = await this.kafkaService.send<
      DeclineWalletInvitationResponse,
      DeclineWalletInvitationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received decline wallet invitation message.', {
      result,
    });

    return result;
  }
}
