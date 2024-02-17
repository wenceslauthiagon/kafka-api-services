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
import { WalletRepository } from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  UpdateWalletByUuidAndUserController,
  UpdateWalletByUuidAndUserRequest,
  UpdateWalletByUuidAndUserResponse,
} from '@zro/operations/interface';

export type UpdateWalletByUuidAndUserKafkaRequest =
  KafkaMessage<UpdateWalletByUuidAndUserRequest>;

export type UpdateWalletByUuidAndUserKafkaResponse =
  KafkaResponse<UpdateWalletByUuidAndUserResponse>;

@Controller()
@MicroserviceController()
export class UpdateWalletByUuidAndUserMicroserviceController {
  /**
   * Parse update wallet by user message and call
   * update wallet by user controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET.UPDATE_BY_UUID_AND_USER)
  async execute(
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @LoggerParam(UpdateWalletByUuidAndUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateWalletByUuidAndUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateWalletByUuidAndUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateWalletByUuidAndUserRequest(message);

    logger.info('Update wallet by user.', { payload });

    // Update get controller.
    const controller = new UpdateWalletByUuidAndUserController(
      logger,
      walletRepository,
    );

    // Update wallet.
    const wallet = await controller.execute(payload);

    logger.info('Wallet updated.', { wallet });

    return {
      ctx,
      value: wallet,
    };
  }
}
