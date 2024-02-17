import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  TranslateService,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  KafkaServiceParam,
  MissingEnvVarException,
  RedisService,
  RepositoryParam,
  KafkaService,
} from '@zro/common';
import { WarningPixSkipListRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  BankingServiceKafka,
  OperationServiceKafka,
  PixDepositEventKafkaEmitter,
  WarningPixSkipListDatabaseRepository,
  PixDepositRedisRepository,
  WarningPixSkipListRedisRepository,
  KAFKA_EVENTS,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePixDepositRequest,
  ReceivePixDepositResponse,
  ReceivePixDepositController,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  BankNotFoundException,
  PixDepositReceivedAccountNotFoundException,
} from '@zro/pix-payments/application';

export type ReceivePixDepositKafkaRequest =
  KafkaMessage<ReceivePixDepositRequest>;

export type ReceivePixDepositKafkaResponse =
  KafkaResponse<ReceivePixDepositResponse>;

interface PixDepositOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL: number;
  APP_WARNING_PIX_DEPOSIT_SKIP_LIST_TTL: number;
}

/**
 * Deposit controller.
 */
@Controller()
@MicroserviceController()
export class ReceivePixDepositMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationNewPixReceivedTransactionTag: string;
  private pixPaymentZroBankIspb: string;
  private depositTtl: number;
  private skipListTtl: number;
  private readonly pixDepositRedisRepository: PixDepositRedisRepository;
  private readonly warningPixSkipListRedisRepository: WarningPixSkipListRedisRepository;

  /**
   * Default deposit RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PixDepositOperationConfig>,
    private readonly redisService: RedisService,
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    if (!this.pixPaymentOperationCurrencyTag) {
      throw new MissingEnvVarException('APP_OPERATION_CURRENCY_TAG');
    }

    this.pixPaymentOperationNewPixReceivedTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG',
      );

    this.pixPaymentZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');

    this.depositTtl = this.configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL',
    );

    this.skipListTtl = this.configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_SKIP_LIST_TTL',
    );

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationNewPixReceivedTransactionTag ||
      !this.pixPaymentZroBankIspb ||
      !this.depositTtl ||
      !this.skipListTtl
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationNewPixReceivedTransactionTag
          ? ['APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG']
          : []),
        ...(!this.pixPaymentZroBankIspb ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.depositTtl
          ? ['APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL']
          : []),
        ...(!this.skipListTtl ? ['APP_WARNING_PIX_DEPOSIT_SKIP_LIST_TTL'] : []),
      ]);
    }

    this.pixDepositRedisRepository = new PixDepositRedisRepository(
      this.redisService,
      this.depositTtl,
    );

    this.warningPixSkipListRedisRepository =
      new WarningPixSkipListRedisRepository(
        this.redisService,
        this.skipListTtl,
      );
  }

  /**
   * Consumer of create a received deposit.
   *
   * @param message Event Kafka message.
   * @param serviceEventEmitter payment event emitter.
   * @param operationService Operation service gateway.
   * @param bankingService Banking service.
   * @param warningPixSkipListRepository Warning Pix Skip List repository.
   * @param logger Global logger instance.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEPOSIT.RECEIVE)
  async execute(
    @Payload('value') message: ReceivePixDepositRequest,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    serviceEventEmitter: PixDepositEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @RepositoryParam(WarningPixSkipListDatabaseRepository)
    warningPixSkipListRepository: WarningPixSkipListRepository,
    @LoggerParam(ReceivePixDepositMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<ReceivePixDepositKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ReceivePixDepositRequest(message);

    logger.info('Create a received deposit.');

    // Create and call create deposit controller.
    const controller = new ReceivePixDepositController(
      logger,
      this.pixDepositRedisRepository,
      this.warningPixSkipListRedisRepository,
      serviceEventEmitter,
      operationService,
      bankingService,
      warningPixSkipListRepository,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationNewPixReceivedTransactionTag,
      this.pixPaymentZroBankIspb,
    );

    try {
      // Create deposit
      const deposit = await controller.execute(payload);

      logger.info('Deposit created.', { deposit });

      return {
        ctx,
        value: deposit,
      };
    } catch (error) {
      // Deposit sent to inexistent or deactivated account or from a bank not found.
      if (
        error instanceof PixDepositReceivedAccountNotFoundException ||
        error instanceof BankNotFoundException
      ) {
        message.description = await this.translateService.translate(
          'default_exceptions',
          error.code,
        );

        await this.kafkaService.emit(KAFKA_EVENTS.PIX_DEPOSIT.NEW_FAILED, {
          ...ctx.getMessage(),
          value: message,
        });
      }

      logger.error('Failed on receive pix deposit process.', {
        value: message,
        error,
      });

      throw error;
    }
  }
}
