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
  DeleteUserWalletByUserAndWalletController,
  DeleteUserWalletByUserAndWalletRequest,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  UserWalletDatabaseRepository,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type DeleteUserWalletByUserAndWalletKafkaRequest =
  KafkaMessage<DeleteUserWalletByUserAndWalletRequest>;

/**
 * UserWallet controller.
 */
@Controller()
@MicroserviceController()
export class DeleteUserWalletByUserAndWalletMicroserviceController {
  /**
   * Consumer of delete user wallet.
   *
   * @param userWalletRepository UserWallet repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WALLET.DELETE_BY_USER_AND_WALLET)
  async execute(
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @LoggerParam(DeleteUserWalletByUserAndWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeleteUserWalletByUserAndWalletRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeleteUserWalletByUserAndWalletRequest(message);

    // Delete and call delete controller.
    const controller = new DeleteUserWalletByUserAndWalletController(
      logger,
      userWalletRepository,
      walletRepository,
    );

    await controller.execute(payload);

    logger.info('User wallet deleted.');
  }
}
