import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  MissingEnvVarException,
} from '@zro/common';
import {
  CurrencyRepository,
  UserWalletRepository,
  WalletAccountRepository,
  WalletRepository,
} from '@zro/operations/domain';
import {
  WalletAccountDatabaseRepository,
  WalletDatabaseRepository,
  CurrencyDatabaseRepository,
  UserWalletDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  HandlePendingUserEventController,
  HandlePendingUserEventRequest,
} from '@zro/operations/interface';
import { KAFKA_EVENTS } from '@zro/users/infrastructure';

export type HandlePendingUserEventKafkaRequest =
  KafkaMessage<HandlePendingUserEventRequest>;

interface PermissionTypeRootConfig {
  APP_OPERATION_PERMISSION_TYPE_ROOT_TAG: string;
}

/**
 * Pending user events observer.
 */
@Controller()
@ObserverController()
export class PendingUserNestObserver {
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
   * Handle pending user event.
   *
   * @param walletAccountRepository Wallet Account repository.
   * @param currencyRepository Currency repository.
   * @param walletRepository Wallet repository.
   * @param logger Local logger instance.
   * @param message Event Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.USER.PENDING)
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @LoggerParam(PendingUserNestObserver)
    logger: Logger,
    @Payload('value') message: HandlePendingUserEventRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingUserEventRequest(message);

    logger.info('Create wallet account.', { payload });

    // Create get controller.
    const controller = new HandlePendingUserEventController(
      logger,
      walletRepository,
      walletAccountRepository,
      currencyRepository,
      userWalletRepository,
      this.permissionTypeRootTag,
    );

    // Create wallet account.
    await controller.execute(payload);

    logger.info('Wallet account created.');
  }
}
