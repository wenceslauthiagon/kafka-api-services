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
  CancelWalletInvitationController,
  CancelWalletInvitationRequest,
  CancelWalletInvitationResponse,
} from '@zro/operations/interface';

export type CancelWalletInvitationKafkaRequest =
  KafkaMessage<CancelWalletInvitationRequest>;

export type CancelWalletInvitationKafkaResponse =
  KafkaResponse<CancelWalletInvitationResponse>;

@Controller()
@MicroserviceController()
export class CancelWalletInvitationMicroserviceController {
  /**
   * Parse cancel wallet invitation message and call
   * cancel wallet invitation controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_INVITATION.CANCEL)
  async execute(
    @RepositoryParam(WalletInvitationDatabaseRepository)
    walletInvitationRepository: WalletInvitationRepository,
    @LoggerParam(CancelWalletInvitationMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelWalletInvitationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelWalletInvitationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelWalletInvitationRequest(message);

    logger.info('Cancel wallet invitation.', { payload });

    // Cancel controller.
    const controller = new CancelWalletInvitationController(
      logger,
      walletInvitationRepository,
    );

    // Cancel wallet invitation.
    const walletInvitation = await controller.execute(payload);

    logger.info('Wallet invitation canceled.', { walletInvitation });

    return {
      ctx,
      value: walletInvitation,
    };
  }
}
