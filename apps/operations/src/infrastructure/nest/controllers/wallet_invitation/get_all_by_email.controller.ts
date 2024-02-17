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
  GetAllWalletInvitationByEmailController,
  GetAllWalletInvitationByEmailRequest,
  GetAllWalletInvitationByEmailResponse,
} from '@zro/operations/interface';

export type GetAllWalletInvitationByEmailKafkaRequest =
  KafkaMessage<GetAllWalletInvitationByEmailRequest>;

export type GetAllWalletInvitationByEmailKafkaResponse =
  KafkaResponse<GetAllWalletInvitationByEmailResponse>;

@Controller()
@MicroserviceController()
export class GetAllWalletInvitationByEmailMicroserviceController {
  /**
   * Parse get wallet invitation by user message and call
   * get wallet invitation controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_INVITATION.GET_ALL_BY_EMAIL)
  async execute(
    @RepositoryParam(WalletInvitationDatabaseRepository)
    walletInvitationRepository: WalletInvitationRepository,
    @LoggerParam(GetAllWalletInvitationByEmailMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllWalletInvitationByEmailRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllWalletInvitationByEmailKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllWalletInvitationByEmailRequest(message);

    logger.info('Get wallet invitation by user.', { payload });

    // Create get controller.
    const controller = new GetAllWalletInvitationByEmailController(
      logger,
      walletInvitationRepository,
    );

    // Get wallet invitation.
    const walletInvitation = await controller.execute(payload);

    logger.info('Wallet invitation found.', { walletInvitation });

    return {
      ctx,
      value: walletInvitation,
    };
  }
}
