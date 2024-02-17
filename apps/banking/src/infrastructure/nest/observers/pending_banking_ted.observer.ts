import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  KafkaService,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  TopazioBankingTedGatewayParam,
  TopazioBankingTedInterceptor,
} from '@zro/topazio';
import {
  BankTedRepository,
  BankingTedRepository,
  BankingContactRepository,
  BankingTedReceivedRepository,
  BankingAccountContactRepository,
} from '@zro/banking/domain';
import { BankingTedGateway } from '@zro/banking/application';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  UserServiceKafka,
  OperationServiceKafka,
  BankingTedEventKafkaEmitter,
  BankingTedReceivedEventKafkaEmitter,
  BankTedDatabaseRepository,
  BankingTedDatabaseRepository,
  BankingContactDatabaseRepository,
  BankingTedReceivedDatabaseRepository,
  BankingAccountContactDatabaseRepository,
} from '@zro/banking/infrastructure';
import {
  HandlePendingBankingTedEventController,
  BankingTedEventEmitterControllerInterface,
  HandlePendingBankingTedEventRequest,
  HandlePendingFailedBankingTedEventController,
  BankingTedReceivedEventEmitterControllerInterface,
} from '@zro/banking/interface';

export type HandlePendingBankingTedEventKafkaRequest =
  KafkaMessage<HandlePendingBankingTedEventRequest>;

export interface BankingTedObserverOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_TED_DESCRIPTION: string;
  APP_OPERATION_TED_P2P_DESCRIPTION: string;
  APP_OPERATION_TED_TRANSACTION_TAG: string;
  APP_OPERATION_TED_P2P_TRANSACTION_TAG: string;
  APP_ZROBANK_CODE: string;
  APP_BANKING_TED_CALLBACK_URL: string;
}

/**
 * BankingTed events observer.
 */
@Controller()
@ObserverController([TopazioBankingTedInterceptor])
export class PendingBankingTedNestObserver {
  private bankingTedOperationCurrencyTag: string;
  private bankingTedOperationTedDescription: string;
  private bankingTedOperationTedP2PDescription: string;
  private bankingTedOperationTedTransactionTag: string;
  private bankingTedOperationTedP2PTransactionTag: string;
  private bankingTedZroBankCode: string;
  private bankingTedCallbackUrl: string;

  constructor(
    private kafkaService: KafkaService,
    private configService: ConfigService<BankingTedObserverOperationConfig>,
  ) {
    this.bankingTedOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.bankingTedOperationTedDescription = this.configService.get<string>(
      'APP_OPERATION_TED_DESCRIPTION',
    );
    this.bankingTedOperationTedP2PDescription = this.configService.get<string>(
      'APP_OPERATION_TED_P2P_DESCRIPTION',
    );
    this.bankingTedOperationTedTransactionTag = this.configService.get<string>(
      'APP_OPERATION_TED_TRANSACTION_TAG',
    );
    this.bankingTedOperationTedP2PTransactionTag =
      this.configService.get<string>('APP_OPERATION_TED_P2P_TRANSACTION_TAG');
    this.bankingTedZroBankCode =
      this.configService.get<string>('APP_ZROBANK_CODE');
    this.bankingTedCallbackUrl = this.configService.get<string>(
      'APP_BANKING_TED_CALLBACK_URL',
    );

    if (
      !this.bankingTedOperationCurrencyTag ||
      !this.bankingTedOperationTedDescription ||
      !this.bankingTedOperationTedP2PDescription ||
      !this.bankingTedOperationTedTransactionTag ||
      !this.bankingTedOperationTedP2PTransactionTag ||
      !this.bankingTedZroBankCode ||
      !this.bankingTedCallbackUrl
    ) {
      throw new MissingEnvVarException([
        ...(!this.bankingTedOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.bankingTedOperationTedDescription
          ? ['APP_OPERATION_TED_DESCRIPTION']
          : []),
        ...(!this.bankingTedOperationTedP2PDescription
          ? ['APP_OPERATION_TED_P2P_DESCRIPTION']
          : []),
        ...(!this.bankingTedOperationTedTransactionTag
          ? ['APP_OPERATION_TED_TRANSACTION_TAG']
          : []),
        ...(!this.bankingTedOperationTedP2PTransactionTag
          ? ['APP_OPERATION_TED_P2P_TRANSACTION_TAG']
          : []),
        ...(!this.bankingTedZroBankCode ? ['APP_ZROBANK_CODE'] : []),
        ...(!this.bankingTedCallbackUrl
          ? ['APP_BANKING_TED_CALLBACK_URL']
          : []),
      ]);
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.BANKING_TED.PENDING.TOPAZIO_GATEWAY,
      KAFKA_HUB.BANKING_TED.PENDING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when bankingTed is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.BANKING_TED.PENDING)
  async handlePendingBankingTedEvent(
    @Payload('value') message: HandlePendingBankingTedEventKafkaRequest,
    @LoggerParam(PendingBankingTedNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added BankingTed event.', { value: message });

    // Select topazio gateway to add BankingTed.
    await this.kafkaService.emit(
      KAFKA_HUB.BANKING_TED.PENDING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  @KafkaEventPattern(KAFKA_HUB.BANKING_TED.PENDING.TOPAZIO_GATEWAY)
  async handlePendingBankingTedEventViaTopazio(
    @Payload('value') message: HandlePendingBankingTedEventRequest,
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @RepositoryParam(BankTedDatabaseRepository)
    bankTedRepository: BankTedRepository,
    @RepositoryParam(BankingTedReceivedDatabaseRepository)
    bankingTedReceivedRepository: BankingTedReceivedRepository,
    @RepositoryParam(BankingContactDatabaseRepository)
    bankingContactRepository: BankingContactRepository,
    @RepositoryParam(BankingAccountContactDatabaseRepository)
    bankingAccountContactRepository: BankingAccountContactRepository,
    @EventEmitterParam(BankingTedEventKafkaEmitter)
    bankingTedServiceEventEmitter: BankingTedEventEmitterControllerInterface,
    @EventEmitterParam(BankingTedReceivedEventKafkaEmitter)
    bankingTedReceivedServiceEventEmitter: BankingTedReceivedEventEmitterControllerInterface,
    @TopazioBankingTedGatewayParam()
    pspGateway: BankingTedGateway,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(PendingBankingTedNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingBankingTedEventRequest(message);

    logger.info('Handle added event pending bankingTed.', { payload });

    const controller = new HandlePendingBankingTedEventController(
      logger,
      bankingTedRepository,
      bankTedRepository,
      bankingTedReceivedRepository,
      bankingContactRepository,
      bankingAccountContactRepository,
      pspGateway,
      bankingTedServiceEventEmitter,
      bankingTedReceivedServiceEventEmitter,
      operationService,
      userService,
      this.bankingTedOperationCurrencyTag,
      this.bankingTedOperationTedP2PTransactionTag,
      this.bankingTedOperationTedTransactionTag,
      this.bankingTedOperationTedP2PDescription,
      this.bankingTedOperationTedDescription,
      this.bankingTedZroBankCode,
      this.bankingTedCallbackUrl,
    );

    try {
      // Call the bankingTed controller.
      const result = await controller.execute(payload);

      logger.info('BankingTed result.', { result });
    } catch (error) {
      logger.error(
        'Failed to add BankingTed.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.BANKING_TED.PENDING.DEAD_LETTER,
        ctx.getMessage(),
      );
    }
  }

  /**
   * Handle BankingTed dead letter event. BankingTeds here failed to all retries.
   *
   * @param message Event Kafka message.
   * @param qrCodeStaticRepository BankingTed repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.BANKING_TED.PENDING.DEAD_LETTER)
  async handlePendingBankingTedDeadLetterEvent(
    @Payload('value') message: HandlePendingBankingTedEventRequest,
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @EventEmitterParam(BankingTedEventKafkaEmitter)
    serviceEventEmitter: BankingTedEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(PendingBankingTedNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingBankingTedEventRequest(message);

    logger.info('Handle added failed event bankingTed.', { payload });

    const controller = new HandlePendingFailedBankingTedEventController(
      logger,
      bankingTedRepository,
      serviceEventEmitter,
      operationService,
    );

    try {
      // Call the bankingTed controller.
      const result = await controller.execute(payload);

      logger.info('bankingTed key updated.', { result });
    } catch (error) {
      logger.error('Failed to add BankingTed in deadLetter.', { error });

      // FIXME: Should notify IT team.
    }
  }
}
