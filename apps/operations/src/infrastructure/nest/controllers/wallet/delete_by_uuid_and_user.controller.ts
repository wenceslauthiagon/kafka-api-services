import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessagePattern,
  KafkaMessage,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RedisService,
  RepositoryParam,
} from '@zro/common';
import {
  CurrencyRepository,
  GlobalLimitRepository,
  LimitTypeRepository,
  OperationRepository,
  P2PTransferRepository,
  TransactionTypeRepository,
  UserLimitRepository,
  UserLimitTrackerRepository,
  UserWalletRepository,
  WalletAccountCacheRepository,
  WalletAccountRepository,
  WalletAccountTransactionRepository,
  WalletRepository,
} from '@zro/operations/domain';
import {
  CurrencyDatabaseRepository,
  GlobalLimitDatabaseRepository,
  KAFKA_TOPICS,
  LimitTypeDatabaseRepository,
  OperationDatabaseRepository,
  OperationEventKafkaEmitter,
  OperationStreamQuotationRedisRepository,
  P2PTransferDatabaseRepository,
  PendingWalletAccountTransactionRedisRepository,
  TransactionTypeDatabaseRepository,
  UserLimitDatabaseRepository,
  UserWalletDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  WalletAccountDatabaseRepository,
  WalletAccountTransactionDatabaseRepository,
  WalletDatabaseRepository,
  UserLimitEventKafkaEmitter,
  UserLimitTrackerDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  DeleteWalletByUuidAndUserController,
  DeleteWalletByUuidAndUserRequest,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';

export type DeleteWalletByUuidAndUserKafkaRequest =
  KafkaMessage<DeleteWalletByUuidAndUserRequest>;

export interface DeleteWalletByUuidConfig {
  APP_OPERATION_P2P_TRANSFER_TRANSACTION_TAG: string;
  APP_OPERATION_GATEWAY_CREDIT_TRANSACTION_TAG: string;
  APP_OPERATION_GATEWAY_DEBIT_TRANSACTION_TAG: string;
  APP_OPERATION_ZRO_DEFAULT_WALLET_ID: string;
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;
  APP_PENDING_WALLET_ACCOUNT_TRANSACTION_DEFAULT_TTL_MS: number;
  APP_OPERATION_STREAM_QUOTATION_DEFAULT_TTL_MS: number;
}

@Controller()
@MicroserviceController()
export class DeleteWalletByUuidAndUserMicroserviceController {
  private readonly createP2PTransferTransactionTag: string;
  private readonly creditTransactionTypeTag: string;
  private readonly debitTransactionTypeTag: string;
  private readonly ZROWalletId: string;
  private readonly operationSymbolCurrencyReal: string;
  private readonly pendingWalletAccountTransactionTTL: number;
  private readonly operationStreamQuotationTTL: number;
  private readonly pendingWalletAccountTransactionRedisRepository: PendingWalletAccountTransactionRedisRepository;
  private readonly operationStreamQuotationRedisRepository: OperationStreamQuotationRedisRepository;

  /**
   * Default operations RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<DeleteWalletByUuidConfig>,
    private readonly redisService: RedisService,
  ) {
    this.createP2PTransferTransactionTag = this.configService.get<string>(
      'APP_OPERATION_P2P_TRANSFER_TRANSACTION_TAG',
    );
    this.creditTransactionTypeTag = this.configService.get<string>(
      'APP_OPERATION_GATEWAY_CREDIT_TRANSACTION_TAG',
    );
    this.debitTransactionTypeTag = this.configService.get<string>(
      'APP_OPERATION_GATEWAY_DEBIT_TRANSACTION_TAG',
    );
    this.ZROWalletId = this.configService.get<string>(
      'APP_OPERATION_ZRO_DEFAULT_WALLET_ID',
    );

    if (
      !this.createP2PTransferTransactionTag ||
      !this.creditTransactionTypeTag ||
      !this.debitTransactionTypeTag ||
      !this.ZROWalletId
    ) {
      throw new MissingEnvVarException([
        ...(!this.createP2PTransferTransactionTag
          ? ['APP_OPERATION_P2P_TRANSFER_TRANSACTION_TAG']
          : []),
        ...(!this.creditTransactionTypeTag
          ? ['APP_OPERATION_GATEWAY_CREDIT_TRANSACTION_TAG']
          : []),
        ...(!this.debitTransactionTypeTag
          ? ['APP_OPERATION_GATEWAY_DEBIT_TRANSACTION_TAG']
          : []),
        ...(!this.ZROWalletId ? ['APP_OPERATION_ZRO_DEFAULT_WALLET_ID'] : []),
      ]);
    }

    this.operationSymbolCurrencyReal = this.configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_REAL',
      'BRL',
    );

    this.pendingWalletAccountTransactionTTL = Number(
      this.configService.get<number>(
        'APP_PENDING_WALLET_ACCOUNT_TRANSACTION_DEFAULT_TTL_MS',
        60000,
      ),
    );

    this.operationStreamQuotationTTL = Number(
      this.configService.get<number>(
        'APP_OPERATION_STREAM_QUOTATION_DEFAULT_TTL_MS',
        60000,
      ),
    );

    this.pendingWalletAccountTransactionRedisRepository =
      new PendingWalletAccountTransactionRedisRepository(this.redisService);

    this.operationStreamQuotationRedisRepository =
      new OperationStreamQuotationRedisRepository(
        this.redisService,
        this.operationStreamQuotationTTL,
      );
  }

  /**
   * Parse delete wallet by user message and call
   * delete wallet by user controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET.DELETE_BY_UUID_AND_USER)
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @RepositoryParam(P2PTransferDatabaseRepository)
    p2pTransferRepository: P2PTransferRepository,
    @RepositoryParam(TransactionTypeDatabaseRepository)
    transactionTypeRepository: TransactionTypeRepository,
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @RepositoryParam(LimitTypeDatabaseRepository)
    limitTypeRepository: LimitTypeRepository,
    @RepositoryParam(UserLimitDatabaseRepository)
    userLimitRepository: UserLimitRepository,
    @RepositoryParam(GlobalLimitDatabaseRepository)
    globalLimitRepository: GlobalLimitRepository,
    @RepositoryParam(WalletAccountTransactionDatabaseRepository)
    walletAccountTransactionRepository: WalletAccountTransactionRepository,
    @RepositoryParam(WalletAccountCacheDatabaseRepository)
    walletAccountCacheRepository: WalletAccountCacheRepository,
    @EventEmitterParam(OperationEventKafkaEmitter)
    eventEmitter: OperationEventEmitterControllerInterface,
    @EventEmitterParam(UserLimitEventKafkaEmitter)
    userLimitEventEmitter: UserLimitEventEmitterControllerInterface,
    @RepositoryParam(UserLimitTrackerDatabaseRepository)
    userLimitTrackerRepository: UserLimitTrackerRepository,
    @LoggerParam(DeleteWalletByUuidAndUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeleteWalletByUuidAndUserRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeleteWalletByUuidAndUserRequest(message);

    logger.info('Delete wallet by user.', { payload });

    // Delete get controller.
    const controller = new DeleteWalletByUuidAndUserController(
      logger,
      walletRepository,
      walletAccountRepository,
      userWalletRepository,
      p2pTransferRepository,
      transactionTypeRepository,
      currencyRepository,
      operationRepository,
      limitTypeRepository,
      userLimitRepository,
      globalLimitRepository,
      walletAccountTransactionRepository,
      walletAccountCacheRepository,
      this.operationStreamQuotationRedisRepository,
      this.pendingWalletAccountTransactionRedisRepository,
      eventEmitter,
      this.createP2PTransferTransactionTag,
      this.operationSymbolCurrencyReal,
      this.pendingWalletAccountTransactionTTL,
      this.creditTransactionTypeTag,
      this.debitTransactionTypeTag,
      this.ZROWalletId,
      userLimitEventEmitter,
      userLimitTrackerRepository,
    );

    // Delete wallet.
    await controller.execute(payload);

    logger.info('Wallet deleted.');
  }
}
