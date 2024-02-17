import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserWalletRepository, WalletRepository } from '@zro/operations/domain';
import {
  DeleteUserWalletController,
  DeleteUserWalletRequest,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  UserWalletDatabaseRepository,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type DeleteUserWalletKafkaRequest =
  KafkaMessage<DeleteUserWalletRequest>;

/**
 * UserWallet controller.
 */
@Controller()
@MicroserviceController()
export class DeleteUserWalletMicroserviceController {
  /**
   * Consumer of delete user wallet.
   *
   * @param userWalletRepository UserWallet repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WALLET.DELETE_BY_WALLET)
  async execute(
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @LoggerParam(DeleteUserWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeleteUserWalletRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeleteUserWalletRequest(message);

    // Delete and call delete controller.
    const controller = new DeleteUserWalletController(
      logger,
      userWalletRepository,
      walletRepository,
    );

    await controller.execute(payload);

    logger.info('User wallet deleted.');
  }
}
