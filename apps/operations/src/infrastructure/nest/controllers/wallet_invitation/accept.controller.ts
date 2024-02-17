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
import {
  UserWalletRepository,
  WalletInvitationRepository,
} from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  WalletInvitationDatabaseRepository,
  UserWalletDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  AcceptWalletInvitationController,
  AcceptWalletInvitationRequest,
  AcceptWalletInvitationResponse,
} from '@zro/operations/interface';

export type AcceptWalletInvitationKafkaRequest =
  KafkaMessage<AcceptWalletInvitationRequest>;

export type AcceptWalletInvitationKafkaResponse =
  KafkaResponse<AcceptWalletInvitationResponse>;

@Controller()
@MicroserviceController()
export class AcceptWalletInvitationMicroserviceController {
  /**
   * Parse accept wallet invitation message and call
   * accept wallet invitation controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_INVITATION.ACCEPT)
  async execute(
    @RepositoryParam(WalletInvitationDatabaseRepository)
    walletInvitationRepository: WalletInvitationRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @LoggerParam(AcceptWalletInvitationMicroserviceController)
    logger: Logger,
    @Payload('value') message: AcceptWalletInvitationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<AcceptWalletInvitationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new AcceptWalletInvitationRequest(message);

    logger.info('Accept wallet invitation.', { payload });

    // Accept controller.
    const controller = new AcceptWalletInvitationController(
      logger,
      walletInvitationRepository,
      userWalletRepository,
    );

    // Accept wallet invitation.
    const walletInvitation = await controller.execute(payload);

    logger.info('Wallet invitation accepted.', { walletInvitation });

    return {
      ctx,
      value: walletInvitation,
    };
  }
}
