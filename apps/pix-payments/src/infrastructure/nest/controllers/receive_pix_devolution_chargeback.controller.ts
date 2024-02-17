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
  TranslateService,
  FailedEntity,
} from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
  PixDevolutionDatabaseRepository,
  PixDevolutionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePixDevolutionChargebackRequest,
  ReceivePixDevolutionChargebackResponse,
  ReceivePixDevolutionChargebackController,
  PixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
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

export type ReceivePixDevolutionChargebackKafkaRequest =
  KafkaMessage<ReceivePixDevolutionChargebackRequest>;

export type ReceivePixDevolutionChargebackKafkaResponse =
  KafkaResponse<ReceivePixDevolutionChargebackResponse>;

/**
 * PixDevolution chargeback controller.
 */
@Controller()
@MicroserviceController()
export class ReceivePixDevolutionChargebackMicroserviceController {
  constructor(private translateService: TranslateService) {}

  /**
   * Consumer of create a received pixDevolution chargeback.
   *
   * @param message Event Kafka message.
   * @param devolutionRepository PixDevolution repository.
   * @param serviceEventEmitter payment event emitter.
   * @param operationService Operation service gateway.
   * @param logger Global logger instance.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION.RECEIVE_CHARGEBACK)
  async execute(
    @Payload('value') message: ReceivePixDevolutionChargebackRequest,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    serviceEventEmitter: PixDevolutionEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(ReceivePixDevolutionChargebackMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<ReceivePixDevolutionChargebackKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ReceivePixDevolutionChargebackRequest(message);

    logger.info('Received a pixDevolution chargeback.', { payload });

    // Create and call create pixDevolution controller.
    const controller = new ReceivePixDevolutionChargebackController(
      logger,
      devolutionRepository,
      depositRepository,
      serviceEventEmitter,
      operationService,
    );

    // Add error messages for pixDevolution
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

    // Create pixDevolution chargeback
    const pixDevolution = await controller.execute(payload);

    logger.info('PixDevolution chargeback updated.', { pixDevolution });

    return {
      ctx,
      value: pixDevolution,
    };
  }
}
