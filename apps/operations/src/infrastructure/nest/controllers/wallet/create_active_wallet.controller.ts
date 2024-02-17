import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import {
  CurrencyRepository,
  UserWalletRepository,
  WalletAccountRepository,
  WalletRepository,
} from '@zro/operations/domain';
import {
  CurrencyDatabaseRepository,
  KAFKA_TOPICS,
  UserWalletDatabaseRepository,
  WalletAccountDatabaseRepository,
  WalletDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  CreateActiveWalletController,
  CreateActiveWalletRequest,
  CreateActiveWalletResponse,
} from '@zro/operations/interface';

export type CreateActiveWalletKafkaRequest =
  KafkaMessage<CreateActiveWalletRequest>;

export type CreateActiveWalletKafkaResponse =
  KafkaResponse<CreateActiveWalletResponse>;

export interface OperationCreateActiveWalletConfig {
  APP_OPERATION_WALLET_ACTIVE_MAX_NUMBER: number;
  APP_OPERATION_PERMISSION_TYPE_ROOT_TAG: string;
}

@Controller()
@MicroserviceController()
export class CreateActiveWalletMicroserviceController {
  private readonly activeWalletMaxNumber: number;
  private readonly permissionTypeRootTag: string;

  /**
   * Default operations RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<OperationCreateActiveWalletConfig>,
  ) {
    this.activeWalletMaxNumber = Number(
      this.configService.get<number>(
        'APP_OPERATION_WALLET_ACTIVE_MAX_NUMBER',
        10,
      ),
    );
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
   * Parse create wallet by user message and call
   * create wallet by user controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET.CREATE_ACTIVE)
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @LoggerParam(CreateActiveWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateActiveWalletRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateActiveWalletKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateActiveWalletRequest(message);

    logger.info('Create active wallet.', { payload });

    // Create get controller.
    const controller = new CreateActiveWalletController(
      logger,
      walletRepository,
      walletAccountRepository,
      currencyRepository,
      userWalletRepository,
      this.activeWalletMaxNumber,
      this.permissionTypeRootTag,
    );

    // Create wallet.
    const wallet = await controller.execute(payload);

    logger.info('Wallet created.', { wallet });

    return {
      ctx,
      value: wallet,
    };
  }
}
