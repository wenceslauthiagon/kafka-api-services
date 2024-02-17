import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
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
  FailedEntity,
  TranslateService,
} from '@zro/common';
import { PaymentRepository } from '@zro/pix-payments/domain';
import {
  ChargebackAB11Exception,
  ChargebackAB09Exception,
  ChargebackAC03Exception,
  ChargebackAC06Exception,
  ChargebackAC07Exception,
  ChargebackAC14Exception,
  ChargebackAG03Exception,
  ChargebackAG12Exception,
  ChargebackAG13Exception,
  ChargebackAGNTException,
  ChargebackAM01Exception,
  ChargebackAM02Exception,
  ChargebackAM04Exception,
  ChargebackAM09Exception,
  ChargebackAM12Exception,
  ChargebackAM18Exception,
  ChargebackBE01Exception,
  ChargebackBE05Exception,
  ChargebackBE17Exception,
  ChargebackCH11Exception,
  ChargebackCH16Exception,
  ChargebackDS0GException,
  ChargebackDS04Exception,
  ChargebackDS24Exception,
  ChargebackDS27Exception,
  ChargebackDT02Exception,
  ChargebackDT05Exception,
  ChargebackED05Exception,
  ChargebackFF07Exception,
  ChargebackFF08Exception,
  ChargebackMD01Exception,
  ChargebackRR04Exception,
  ChargebackSL02Exception,
  ChargebackDefaultException,
} from '@zro/pix-payments/application';
import {
  KAFKA_TOPICS,
  OperationServiceKafka,
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePaymentChargebackRequest,
  ReceivePaymentChargebackResponse,
  ReceivePaymentChargebackController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

// All exceptions classes
const errorTypes = {
  ChargebackAB11Exception,
  ChargebackAB09Exception,
  ChargebackAC03Exception,
  ChargebackAC06Exception,
  ChargebackAC07Exception,
  ChargebackAC14Exception,
  ChargebackAG03Exception,
  ChargebackAG12Exception,
  ChargebackAG13Exception,
  ChargebackAGNTException,
  ChargebackAM01Exception,
  ChargebackAM02Exception,
  ChargebackAM04Exception,
  ChargebackAM09Exception,
  ChargebackAM12Exception,
  ChargebackAM18Exception,
  ChargebackBE01Exception,
  ChargebackBE05Exception,
  ChargebackBE17Exception,
  ChargebackCH11Exception,
  ChargebackCH16Exception,
  ChargebackDS0GException,
  ChargebackDS04Exception,
  ChargebackDS24Exception,
  ChargebackDS27Exception,
  ChargebackDT02Exception,
  ChargebackDT05Exception,
  ChargebackED05Exception,
  ChargebackFF07Exception,
  ChargebackFF08Exception,
  ChargebackMD01Exception,
  ChargebackRR04Exception,
  ChargebackSL02Exception,
  ChargebackDefaultException,
};

export type ReceivePaymentChargebackKafkaRequest =
  KafkaMessage<ReceivePaymentChargebackRequest>;

export type ReceivePaymentChargebackKafkaResponse =
  KafkaResponse<ReceivePaymentChargebackResponse>;

/**
 * Payment chargeback controller.
 */
@Controller()
@MicroserviceController()
export class ReceivePaymentChargebackMicroserviceController {
  constructor(private translateService: TranslateService) {}

  /**
   * Consumer of create a received payment chargeback.
   *
   * @param message Event Kafka message.
   * @param paymentRepository Payment repository.
   * @param serviceEventEmitter payment event emitter.
   * @param operationService Operation service gateway.
   * @param logger Global logger instance.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.RECEIVE_CHARGEBACK)
  async execute(
    @Payload('value') message: ReceivePaymentChargebackRequest,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    serviceEventEmitter: PaymentEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(ReceivePaymentChargebackMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<ReceivePaymentChargebackKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ReceivePaymentChargebackRequest(message);

    logger.info('Received a payment chargeback.', { payload });

    // Create and call create payment controller.
    const controller = new ReceivePaymentChargebackController(
      logger,
      paymentRepository,
      serviceEventEmitter,
      operationService,
    );

    let classCode = `Chargeback${payload.chargebackReason
      ?.toUpperCase()
      .substring(0, 4)}Exception`;

    if (!errorTypes[classCode]) {
      classCode = `ChargebackDefaultException`;
    }

    const error = new errorTypes[classCode](payload.chargebackReason);
    const errorMessage = await this.translateService.translate(
      'chargeback_exceptions',
      error.code,
    );
    payload.failed = new FailedEntity({
      code: error.code,
      message: errorMessage,
    });

    // Create payment chargeback
    const payment = await controller.execute(payload);

    logger.info('Payment chargeback updated.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
