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
  GetAllUserWalletByUserController,
  GetAllUserWalletByUserRequest,
  GetUserWalletByUserAndWalletResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  UserServiceKafka,
  UserWalletDatabaseRepository,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetAllUserWalletByUserKafkaRequest =
  KafkaMessage<GetAllUserWalletByUserRequest>;

export type GetAllUserWalletByUserKafkaResponse = KafkaResponse<
  GetUserWalletByUserAndWalletResponse[]
>;

/**
 * UserWallet controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetAllUserWalletByUserMicroserviceController {
  /**
   * Consumer of get all by user id.
   *
   * @param walletRepository Wallet repository.
   * @param userWalletRepository UserWallet repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WALLET.GET_ALL_BY_USER)
  async execute(
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @LoggerParam(GetAllUserWalletByUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllUserWalletByUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllUserWalletByUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllUserWalletByUserRequest(message);

    // Create and call get by id controller.
    const controller = new GetAllUserWalletByUserController(
      logger,
      walletRepository,
      userWalletRepository,
      userService,
    );

    const userWallets = await controller.execute(payload);

    logger.info('User wallets found.', { userWallets });

    return {
      ctx,
      value: userWallets,
    };
  }
}
