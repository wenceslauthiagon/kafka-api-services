import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
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
  UserLimitTrackerRepository,
  WalletAccountCacheRepository,
  WalletAccountRepository,
  WalletRepository,
} from '@zro/operations/domain';
import {
  CreateOperationController,
  CreateOperationRequest,
  CreateOperationResponse,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';
import {
  CurrencyDatabaseRepository,
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  TransactionTypeDatabaseRepository,
  WalletAccountDatabaseRepository,
  WalletDatabaseRepository,
  LimitTypeDatabaseRepository,
  UserLimitDatabaseRepository,
  GlobalLimitDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  PendingWalletAccountTransactionRedisRepository,
  OperationStreamQuotationRedisRepository,
  OperationEventKafkaEmitter,
  UserLimitEventKafkaEmitter,
  UserLimitTrackerDatabaseRepository,
} from '@zro/operations/infrastructure';

export type CreateOperationKafkaRequest = KafkaMessage<CreateOperationRequest>;

export type CreateOperationKafkaResponse =
  KafkaResponse<CreateOperationResponse>;

export interface CreateOperationConfig {
  APP_OPERATION_SYMBOL_CURRENCY_REAL: string;
  APP_PENDING_WALLET_ACCOUNT_TRANSACTION_DEFAULT_TTL_MS: number;
  APP_OPERATION_STREAM_QUOTATION_DEFAULT_TTL_MS: number;
}

@Controller()
@MicroserviceController()
export class CreateOperationMicroserviceController {
  private readonly operationSymbolCurrencyReal: string;
  private readonly pendingWalletAccountTransactionTTL: number;
  private readonly operationStreamQuotationTTL: number;
  private readonly pendingWalletAccountTransactionRedisRepository: PendingWalletAccountTransactionRedisRepository;
  private readonly operationStreamQuotationRedisRepository: OperationStreamQuotationRedisRepository;

  constructor(
    readonly configService: ConfigService<CreateOperationConfig>,
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
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.CREATE)
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
    @RepositoryParam(WalletAccountCacheDatabaseRepository)
    walletAccountCacheRepository: WalletAccountCacheRepository,
    @EventEmitterParam(OperationEventKafkaEmitter)
    eventEmitter: OperationEventEmitterControllerInterface,
    @EventEmitterParam(UserLimitEventKafkaEmitter)
    userLimitEventEmitter: UserLimitEventEmitterControllerInterface,
    @RepositoryParam(UserLimitTrackerDatabaseRepository)
    userLimitTrackerRepository: UserLimitTrackerRepository,
    @LoggerParam(CreateOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateOperationKafkaResponse> {
    logger.debug('Received message', { value: message });

    // Parse kafka message.
    const request = new CreateOperationRequest(message);

    logger.info('Create operation', { request });

    // Create controller.
    const controller = new CreateOperationController(
      logger,
      transactionTypeRepository,
      currencyRepository,
      walletRepository,
      walletAccountRepository,
      operationRepository,
      limitTypeRepository,
      userLimitRepository,
      globalLimitRepository,
      walletAccountCacheRepository,
      this.operationStreamQuotationRedisRepository,
      this.pendingWalletAccountTransactionRedisRepository,
      eventEmitter,
      this.operationSymbolCurrencyReal,
      this.pendingWalletAccountTransactionTTL,
      userLimitEventEmitter,
      userLimitTrackerRepository,
    );

    // Create operation.
    const createdOperation = await controller.execute(request);

    logger.info('Created operation.', { createdOperation });

    return {
      ctx,
      value: createdOperation,
    };
  }
}
