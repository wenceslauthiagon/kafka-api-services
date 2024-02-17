import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RedisService,
  RepositoryParam,
} from '@zro/common';
import {
  CurrencyRepository,
  GlobalLimitRepository,
  LimitTypeRepository,
  OperationRepository,
  TransactionTypeRepository,
  UserLimitRepository,
  WalletAccountCacheRepository,
  WalletRepository,
  WalletAccountRepository,
  WalletAccountTransactionRepository,
  UserLimitTrackerRepository,
} from '@zro/operations/domain';
import {
  CreateAndAcceptOperationController,
  CreateAndAcceptOperationRequest,
  CreateAndAcceptOperationResponse,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';
import {
  CurrencyDatabaseRepository,
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  TransactionTypeDatabaseRepository,
  WalletDatabaseRepository,
  WalletAccountDatabaseRepository,
  LimitTypeDatabaseRepository,
  UserLimitDatabaseRepository,
  GlobalLimitDatabaseRepository,
  WalletAccountTransactionDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  PendingWalletAccountTransactionRedisRepository,
  OperationStreamQuotationRedisRepository,
  OperationEventKafkaEmitter,
  UserLimitEventKafkaEmitter,
  UserLimitTrackerDatabaseRepository,
} from '@zro/operations/infrastructure';

export type CreateAndAcceptOperationKafkaRequest =
  KafkaMessage<CreateAndAcceptOperationRequest>;

export type CreateAndAcceptOperationKafkaResponse =
  KafkaResponse<CreateAndAcceptOperationResponse>;

export interface CreateAndAcceptOperationConfig {
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;
  APP_PENDING_WALLET_ACCOUNT_TRANSACTION_DEFAULT_TTL_MS: number;
  APP_OPERATION_STREAM_QUOTATION_DEFAULT_TTL_MS: number;
}

@Controller()
@MicroserviceController()
export class CreateAndAcceptOperationMicroserviceController {
  private readonly operationSymbolCurrencyReal: string;
  private readonly pendingWalletAccountTransactionTTL: number;
  private readonly operationStreamQuotationTTL: number;
  private readonly pendingWalletAccountTransactionRedisRepository: PendingWalletAccountTransactionRedisRepository;
  private readonly operationStreamQuotationRedisRepository: OperationStreamQuotationRedisRepository;

  constructor(
    readonly configService: ConfigService<CreateAndAcceptOperationConfig>,
    private readonly redisService: RedisService,
  ) {
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
   * Create an operation from a kafka request.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.CREATE_AND_ACCEPT)
  async execute(
    @RepositoryParam(TransactionTypeDatabaseRepository)
    transactionTypeRepository: TransactionTypeRepository,
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @RepositoryParam(WalletDatabaseRepository)
    walletRepository: WalletRepository,
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
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
    @LoggerParam(CreateAndAcceptOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateAndAcceptOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateAndAcceptOperationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const request = new CreateAndAcceptOperationRequest(message);

    logger.info('Create and accept operation.', { request });

    // Create controller.
    const controller = new CreateAndAcceptOperationController(
      logger,
      transactionTypeRepository,
      currencyRepository,
      walletRepository,
      walletAccountRepository,
      operationRepository,
      limitTypeRepository,
      userLimitRepository,
      globalLimitRepository,
      walletAccountTransactionRepository,
      walletAccountCacheRepository,
      this.operationStreamQuotationRedisRepository,
      this.pendingWalletAccountTransactionRedisRepository,
      eventEmitter,
      this.operationSymbolCurrencyReal,
      this.pendingWalletAccountTransactionTTL,
      userLimitEventEmitter,
      userLimitTrackerRepository,
    );

    // Create and accept operation.
    const result = await controller.execute(request);

    logger.info('Created and accept operation.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
