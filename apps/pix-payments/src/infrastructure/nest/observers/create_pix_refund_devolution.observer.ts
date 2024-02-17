import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  MissingEnvVarException,
} from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionRefundOperationRepository,
  PixRefundDevolutionRepository,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionDatabaseRepository,
  PixRefundDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  PixRefundDatabaseRepository,
  PixDepositDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCreatePixRefundDevolutionEventController,
  PixRefundDevolutionEventEmitterControllerInterface,
  HandleCreatePixRefundDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandleCreatePixRefundDevolutionEventKafkaRequest =
  KafkaMessage<HandleCreatePixRefundDevolutionEventRequest>;

interface RefundDevolutionConfig {
  APP_PIX_REFUND_DEVOLUTION_MAX_NUMBER: string;
  APP_PIX_TRANSACTION_REFUND_DEVOLUTION_INTERVAL_DAYS: string;
}

/**
 * PixRefundDevolution create events observer.
 */
@Controller()
@ObserverController()
export class CreatePixRefundDevolutionNestObserver {
  /**
   * The default number is 0, so there's no limit to create refund devolution
   */
  private readonly REFUND_DEVOLUTION_MAX_NUMBER_DEFAULT: string = '0';

  /**
   * The interval of days that a refund devolution can be requested.
   */
  private transactionRefundDevolutionIntervalDays: number;

  /**
   * The maximum number of refund devolutions for a transaction.
   * If flag is 0, so there's no limit to create refund devolution
   */
  private readonly refundDevolutionMaxNumber: number;

  /**
   * Default devolution RPC controller constructor.
   */
  constructor(private configService: ConfigService<RefundDevolutionConfig>) {
    this.refundDevolutionMaxNumber = parseInt(
      this.configService.get<string>('APP_PIX_REFUND_DEVOLUTION_MAX_NUMBER') ||
        this.REFUND_DEVOLUTION_MAX_NUMBER_DEFAULT,
    );

    this.transactionRefundDevolutionIntervalDays =
      this.configService.get<number>(
        'APP_PIX_TRANSACTION_REFUND_DEVOLUTION_INTERVAL_DAYS',
      );
    if (!this.transactionRefundDevolutionIntervalDays) {
      throw new MissingEnvVarException(
        'APP_PIX_TRANSACTION_REFUND_DEVOLUTION_INTERVAL_DAYS',
      );
    }
  }

  /**
   * Handler triggered when devolution is created.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND_DEVOLUTION.CREATED)
  async execute(
    @Payload('value') message: HandleCreatePixRefundDevolutionEventRequest,
    @RepositoryParam(PixRefundDevolutionDatabaseRepository)
    refundDevolutionRepository: PixRefundDevolutionRepository,
    @RepositoryParam(PixRefundDatabaseRepository)
    refundRepository: PixRefundRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @EventEmitterParam(PixRefundDevolutionEventKafkaEmitter)
    serviceRefundDevolutionEventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    @LoggerParam(CreatePixRefundDevolutionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCreatePixRefundDevolutionEventRequest(message);

    logger.info('Handle added event create devolution.', { payload });

    const controller = new HandleCreatePixRefundDevolutionEventController(
      logger,
      refundDevolutionRepository,
      refundRepository,
      serviceRefundDevolutionEventEmitter,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      this.refundDevolutionMaxNumber,
      this.transactionRefundDevolutionIntervalDays,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('Refund devolution created.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to create pixRefundDevolution.', {
        error: logError,
      });
    }
  }
}
