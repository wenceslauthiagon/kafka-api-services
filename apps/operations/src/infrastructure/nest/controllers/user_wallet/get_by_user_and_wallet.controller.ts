import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserWalletRepository, WalletRepository } from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';
import {
  GetUserWalletByUserAndWalletController,
  GetUserWalletByUserAndWalletRequest,
  GetUserWalletByUserAndWalletResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  UserServiceKafka,
  UserWalletDatabaseRepository,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetUserWalletByUserAndWalletKafkaRequest =
  KafkaMessage<GetUserWalletByUserAndWalletRequest>;

export type GetUserWalletByUserAndWalletKafkaResponse =
  KafkaResponse<GetUserWalletByUserAndWalletResponse>;

/**
 * UserWallet controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetUserWalletByUserAndWalletMicroserviceController {
  /**
   * Consumer of get by user and wallet.
   *
   * @param walletRepository Wallet repository.
   * @param userWalletRepository UserWallet repository.
   * @param userService User service.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WALLET.GET_BY_USER_AND_WALLET)
  async execute(
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @LoggerParam(GetUserWalletByUserAndWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserWalletByUserAndWalletRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserWalletByUserAndWalletKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserWalletByUserAndWalletRequest(message);

    // Create and call get by id controller.
    const controller = new GetUserWalletByUserAndWalletController(
      logger,
      walletRepository,
      userWalletRepository,
      userService,
    );

    const userWallet = await controller.execute(payload);

    logger.info('User wallets found.', { userWallet });

    return {
      ctx,
      value: userWallet,
    };
  }
}
