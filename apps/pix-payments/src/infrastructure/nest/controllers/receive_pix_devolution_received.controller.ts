import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  PixDevolutionReceivedRepository,
  PaymentRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  BankingServiceKafka,
  OperationServiceKafka,
  PaymentDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
  PixDevolutionReceivedEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePixDevolutionReceivedRequest,
  ReceivePixDevolutionReceivedResponse,
  ReceivePixDevolutionReceivedController,
  PixDevolutionReceivedEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type ReceivePixDevolutionReceivedKafkaRequest =
  KafkaMessage<ReceivePixDevolutionReceivedRequest>;

export type ReceivePixDevolutionReceivedKafkaResponse =
  KafkaResponse<ReceivePixDevolutionReceivedResponse>;

interface PixDevolutionReceivedOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_PIX_DEVOLUTION_RECEIVED_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
}

/**
 * PixDevolutionReceived controller.
 */
@Controller()
@MicroserviceController()
export class ReceivePixDevolutionReceivedMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixDevolutionReceivedOperationTransactionTag: string;
  private pixPaymentZroBankIspb: string;

  /**
   * Default PixDevolutionReceived RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PixDevolutionReceivedOperationConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );

    this.pixDevolutionReceivedOperationTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_PIX_DEVOLUTION_RECEIVED_TRANSACTION_TAG',
      );

    this.pixPaymentZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixDevolutionReceivedOperationTransactionTag ||
      !this.pixPaymentZroBankIspb
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixDevolutionReceivedOperationTransactionTag
          ? ['APP_OPERATION_PIX_DEVOLUTION_RECEIVED_TRANSACTION_TAG']
          : []),
        ...(!this.pixPaymentZroBankIspb ? ['APP_ZROBANK_ISPB'] : []),
      ]);
    }
  }

  /**
   * Handler triggered when to create a new devolution received by psp.
   *
   * @param message Event Kafka message.
   * @param devolutionReceivedRepository PixDevolutionReceived repository.
   * @param serviceEventEmitter Event emitter.
   * @param operationService Operation service gateway.
   * @param bankingService Banking service gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.RECEIVE)
  async execute(
    @Payload('value') message: ReceivePixDevolutionReceivedRequest,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @RepositoryParam(PaymentDatabaseRepository)
    pixPaymentRepository: PaymentRepository,
    @EventEmitterParam(PixDevolutionReceivedEventKafkaEmitter)
    serviceEventEmitter: PixDevolutionReceivedEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @LoggerParam(ReceivePixDevolutionReceivedMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<ReceivePixDevolutionReceivedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ReceivePixDevolutionReceivedRequest(message);

    logger.info('Create a pixDevolutionReceived.');

    // Create and call create pixDevolutionReceived controller.
    const controller = new ReceivePixDevolutionReceivedController(
      logger,
      devolutionReceivedRepository,
      pixPaymentRepository,
      serviceEventEmitter,
      operationService,
      bankingService,
      this.pixPaymentOperationCurrencyTag,
      this.pixDevolutionReceivedOperationTransactionTag,
      this.pixPaymentZroBankIspb,
    );

    // Create pixDevolutionReceived
    const pixDevolutionReceived = await controller.execute(payload);

    logger.info('PixDevolutionReceived created.', { pixDevolutionReceived });

    return {
      ctx,
      value: pixDevolutionReceived,
    };
  }
}
