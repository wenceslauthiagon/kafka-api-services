import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { WalletInvitationRepository } from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  WalletInvitationDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  DeclineWalletInvitationController,
  DeclineWalletInvitationRequest,
  DeclineWalletInvitationResponse,
} from '@zro/operations/interface';

export type DeclineWalletInvitationKafkaRequest =
  KafkaMessage<DeclineWalletInvitationRequest>;

export type DeclineWalletInvitationKafkaResponse =
  KafkaResponse<DeclineWalletInvitationResponse>;

@Controller()
@MicroserviceController()
export class DeclineWalletInvitationMicroserviceController {
  /**
   * Parse decline wallet invitation message and call
   * decline wallet invitation controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_INVITATION.DECLINE)
  async execute(
    @RepositoryParam(WalletInvitationDatabaseRepository)
    walletInvitationRepository: WalletInvitationRepository,
    @LoggerParam(DeclineWalletInvitationMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeclineWalletInvitationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<DeclineWalletInvitationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeclineWalletInvitationRequest(message);

    logger.info('Decline wallet invitation.', { payload });

    // Decline controller.
    const controller = new DeclineWalletInvitationController(
      logger,
      walletInvitationRepository,
    );

    // Decline wallet invitation.
    const walletInvitation = await controller.execute(payload);

    logger.info('Wallet invitation declined.', { walletInvitation });

    return {
      ctx,
      value: walletInvitation,
    };
  }
}
