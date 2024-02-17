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
import { UserWalletRepository } from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';
import {
  GetAllUserWalletByUserAndWalletController,
  GetAllUserWalletByUserAndWalletRequest,
  GetAllUserWalletByUserAndWalletResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  UserServiceKafka,
  UserWalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetAllUserWalletByUserAndWalletKafkaRequest =
  KafkaMessage<GetAllUserWalletByUserAndWalletRequest>;

export type GetAllUserWalletByUserAndWalletKafkaResponse =
  KafkaResponse<GetAllUserWalletByUserAndWalletResponse>;

/**
 * UserWallet controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetAllUserWalletByUserAndWalletMicroserviceController {
  /**
   * Consumer of get by user and wallet.
   *
   * @param userWalletRepository UserWallet repository.
   * @param userService User service.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WALLET.GET_ALL_BY_USER_AND_WALLET)
  async execute(
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @LoggerParam(GetAllUserWalletByUserAndWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllUserWalletByUserAndWalletRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllUserWalletByUserAndWalletKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllUserWalletByUserAndWalletRequest(message);

    // Create and call get by id controller.
    const controller = new GetAllUserWalletByUserAndWalletController(
      logger,
      userWalletRepository,
      userService,
    );

    const permissions = await controller.execute(payload);

    logger.info('User wallets permissions found.', { permissions });

    return {
      ctx,
      value: permissions,
    };
  }
}
