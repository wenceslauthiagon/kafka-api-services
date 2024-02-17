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
  GetAllWalletInvitationByUserController,
  GetAllWalletInvitationByUserRequest,
  GetAllWalletInvitationByUserResponse,
} from '@zro/operations/interface';

export type GetAllWalletInvitationByUserKafkaRequest =
  KafkaMessage<GetAllWalletInvitationByUserRequest>;

export type GetAllWalletInvitationByUserKafkaResponse =
  KafkaResponse<GetAllWalletInvitationByUserResponse>;

@Controller()
@MicroserviceController()
export class GetAllWalletInvitationByUserMicroserviceController {
  /**
   * Parse get wallet invitation by user message and call
   * get wallet invitation controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_INVITATION.GET_ALL_BY_USER)
  async execute(
    @RepositoryParam(WalletInvitationDatabaseRepository)
    walletInvitationRepository: WalletInvitationRepository,
    @LoggerParam(GetAllWalletInvitationByUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllWalletInvitationByUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllWalletInvitationByUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllWalletInvitationByUserRequest(message);

    logger.info('Get wallet invitation by user.', {
      payload,
    });

    // Create get controller.
    const controller = new GetAllWalletInvitationByUserController(
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
