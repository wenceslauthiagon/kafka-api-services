import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateWalletInvitationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  CreateWalletInvitationRequest,
  CreateWalletInvitationResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET_INVITATION.CREATE;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateWalletInvitationServiceKafka {
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
      context: CreateWalletInvitationServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to create.
   * @param payload Data.
   */
  async execute(
    payload: CreateWalletInvitationRequest,
  ): Promise<CreateWalletInvitationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateWalletInvitationKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send create wallet invitation.', { data });

    // Call create walletInvitation microservice.
    const result = await this.kafkaService.send<
      CreateWalletInvitationResponse,
      CreateWalletInvitationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received create wallet invitation message.', {
      result,
    });

    return result;
  }
}
