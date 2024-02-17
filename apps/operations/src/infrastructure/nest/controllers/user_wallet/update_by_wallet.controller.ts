import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import { UserWalletRepository, WalletRepository } from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';
import {
  UpdateUserWalletByWalletController,
  UpdateUserWalletByWalletRequest,
  UpdateUserWalletByWalletResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  UserServiceKafka,
  UserWalletDatabaseRepository,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';

export type UpdateUserWalletByWalletKafkaRequest =
  KafkaMessage<UpdateUserWalletByWalletRequest>;

export type UpdateUserWalletByWalletKafkaResponse =
  KafkaResponse<UpdateUserWalletByWalletResponse>;

interface PermissionTypeRootConfig {
  APP_OPERATION_PERMISSION_TYPE_ROOT_TAG: string;
}

/**
 * UserWallet controller.
 */
@Controller()
@MicroserviceController()
export class UpdateUserWalletByWalletMicroserviceController {
  private readonly permissionTypeRootTag: string;

  /**
   * Default operations RPC controller constructor.
   */
  constructor(private configService: ConfigService<PermissionTypeRootConfig>) {
    this.permissionTypeRootTag = this.configService.get<string>(
      'APP_OPERATION_PERMISSION_TYPE_ROOT_TAG',
    );

    if (!this.permissionTypeRootTag) {
      throw new MissingEnvVarException([
        'APP_OPERATION_PERMISSION_TYPE_ROOT_TAG',
      ]);
    }
  }

  /**
   * Consumer of update by user and wallet.
   *
   * @param walletRepository Wallet repository.
   * @param userWalletRepository UserWallet repository.
   * @param userService User service.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WALLET.UPDATE_BY_WALLET)
  async execute(
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @LoggerParam(UpdateUserWalletByWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateUserWalletByWalletRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateUserWalletByWalletKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateUserWalletByWalletRequest(message);

    // Create and call update by id controller.
    const controller = new UpdateUserWalletByWalletController(
      logger,
      walletRepository,
      userWalletRepository,
      userService,
      this.permissionTypeRootTag,
    );

    const userWallet = await controller.execute(payload);

    logger.info('User wallets updated.', { userWallet });

    return {
      ctx,
      value: userWallet,
    };
  }
}
