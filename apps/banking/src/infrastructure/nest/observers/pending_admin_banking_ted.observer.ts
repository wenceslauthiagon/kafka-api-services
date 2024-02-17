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
  MissingEnvVarException,
} from '@zro/common';
import {
  TopazioBankingTedGatewayParam,
  TopazioBankingTedInterceptor,
} from '@zro/topazio';
import {
  AdminBankingAccountRepository,
  AdminBankingTedRepository,
} from '@zro/banking/domain';
import { BankingTedGateway } from '@zro/banking/application';
import {
  AdminBankingTedDatabaseRepository,
  AdminBankingTedEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
  AdminBankingAccountDatabaseRepository,
} from '@zro/banking/infrastructure';
import {
  HandlePendingAdminBankingTedEventController,
  AdminBankingTedEventEmitterControllerInterface,
  HandlePendingAdminBankingTedEventRequest,
  HandlePendingFailedAdminBankingTedEventController,
} from '@zro/banking/interface';

export type HandlePendingAdminBankingTedEventKafkaRequest =
  KafkaMessage<HandlePendingAdminBankingTedEventRequest>;

export interface AdminBankingTedObserverOperationConfig {
  APP_BANKING_TED_CALLBACK_URL: string;
}

/**
 * AdminBankingTed events observer.
 */
@Controller()
@ObserverController([TopazioBankingTedInterceptor])
export class PendingAdminBankingTedNestObserver {
  private bankingTedCallbackUrl: string;

  constructor(
    private kafkaService: KafkaService,
    private configService: ConfigService<AdminBankingTedObserverOperationConfig>,
  ) {
    this.bankingTedCallbackUrl = this.configService.get<string>(
      'APP_BANKING_TED_CALLBACK_URL',
    );

    if (!this.bankingTedCallbackUrl) {
      throw new MissingEnvVarException([
        ...(!this.bankingTedCallbackUrl
          ? ['APP_BANKING_TED_CALLBACK_URL']
          : []),
      ]);
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.ADMIN_BANKING_TED.PENDING.TOPAZIO_GATEWAY,
      KAFKA_HUB.ADMIN_BANKING_TED.PENDING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when adminBankingTed is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.ADMIN_BANKING_TED.PENDING)
  async handlePendingAdminBankingTedEvent(
    @Payload('value') message: HandlePendingAdminBankingTedEventRequest,
    @LoggerParam(PendingAdminBankingTedNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added AdminBankingTed event.', { value: message });

    // Select topazio gateway to add AdminBankingTed.
    await this.kafkaService.emit(
      KAFKA_HUB.ADMIN_BANKING_TED.PENDING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  @KafkaEventPattern(KAFKA_HUB.ADMIN_BANKING_TED.PENDING.TOPAZIO_GATEWAY)
  async handlePendingAdminBankingTedEventViaTopazio(
    @Payload('value') message: HandlePendingAdminBankingTedEventRequest,
    @RepositoryParam(AdminBankingAccountDatabaseRepository)
    adminBankingAccountRepository: AdminBankingAccountRepository,
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    adminBankingTedRepository: AdminBankingTedRepository,
    @EventEmitterParam(AdminBankingTedEventKafkaEmitter)
    adminBankingTedServiceEventEmitter: AdminBankingTedEventEmitterControllerInterface,
    @TopazioBankingTedGatewayParam()
    pspGateway: BankingTedGateway,
    @LoggerParam(PendingAdminBankingTedNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingAdminBankingTedEventRequest(message);

    logger.info('Handle added event pending adminBankingTed.', { payload });

    const controller = new HandlePendingAdminBankingTedEventController(
      logger,
      adminBankingAccountRepository,
      adminBankingTedRepository,
      pspGateway,
      adminBankingTedServiceEventEmitter,
      this.bankingTedCallbackUrl,
    );

    try {
      // Call the adminBankingTed controller.
      const result = await controller.execute(payload);

      logger.info('AdminBankingTed result.', { result });
    } catch (error) {
      logger.error(
        'Failed to add AdminBankingTed.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.ADMIN_BANKING_TED.PENDING.DEAD_LETTER,
        ctx.getMessage(),
      );
    }
  }

  /**
   * Handle AdminBankingTed dead letter event. AdminBankingTeds here failed to all retries.
   *
   * @param message Event Kafka message.
   * @param adminBankingTedRepository AdminBankingTed repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.ADMIN_BANKING_TED.PENDING.DEAD_LETTER)
  async handlePendingAdminBankingTedDeadLetterEvent(
    @Payload('value') message: HandlePendingAdminBankingTedEventRequest,
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    adminBankingTedRepository: AdminBankingTedRepository,
    @EventEmitterParam(AdminBankingTedEventKafkaEmitter)
    serviceEventEmitter: AdminBankingTedEventEmitterControllerInterface,
    @LoggerParam(PendingAdminBankingTedNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingAdminBankingTedEventRequest(message);

    logger.info('Handle added failed event adminBankingTed.', { payload });

    const controller = new HandlePendingFailedAdminBankingTedEventController(
      logger,
      adminBankingTedRepository,
      serviceEventEmitter,
    );

    try {
      // Call the adminBankingTed controller.
      const result = await controller.execute(payload);

      logger.info('adminBankingTed key updated.', { result });
    } catch (error) {
      logger.error('Failed to add AdminBankingTed in deadLetter.', { error });

      // TODO: Send message to slack IT team
    }
  }
}
