import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CancelWalletInvitationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  CancelWalletInvitationRequest,
  CancelWalletInvitationResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_INVITATION.CANCEL;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CancelWalletInvitationServiceKafka {
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
      context: CancelWalletInvitationServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to cancel.
   * @param payload Data.
   */
  async execute(
    payload: CancelWalletInvitationRequest,
  ): Promise<CancelWalletInvitationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CancelWalletInvitationKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send cancel wallet invitation.', { data });

    // Call cancel walletInvitation microservice.
    const result = await this.kafkaService.send<
      CancelWalletInvitationResponse,
      CancelWalletInvitationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received cancel wallet invitation message.', {
      result,
    });

    return result;
  }
}
