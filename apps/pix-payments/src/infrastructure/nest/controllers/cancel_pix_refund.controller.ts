import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  LoggerParam,
  RepositoryParam,
  MicroserviceController,
  KafkaServiceParam,
} from '@zro/common';
import {
  PixInfractionRefundOperationRepository,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixRefundDatabaseRepository,
  PixRefundEventKafkaEmitter,
  OperationServiceKafka,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPixRefundRequest,
  CancelPixRefundResponse,
  CancelPixRefundController,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CancelPixRefundKafkaRequest = KafkaMessage<CancelPixRefundRequest>;

export type CancelPixRefundKafkaResponse =
  KafkaResponse<CancelPixRefundResponse>;

/**
 * Cancel PixRefund controller.
 */
@Controller()
@MicroserviceController()
export class CancelPixRefundMicroserviceController {
  /**
   * Consumer of open infraction.
   *
   * @param infractionRepository PixRefund repository.
   * @param eventEmitter PixRefund event emitter.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_REFUND.CANCEL)
  async execute(
    @LoggerParam(CancelPixRefundMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixRefundDatabaseRepository)
    infractionRepository: PixRefundRepository,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @EventEmitterParam(PixRefundEventKafkaEmitter)
    eventEmitter: PixRefundEventEmitterControllerInterface,
    @Payload('value') message: CancelPixRefundRequest,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelPixRefundKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelPixRefundRequest(message);

    // cancel refund controller.
    const controller = new CancelPixRefundController(
      logger,
      infractionRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
      operationService,
    );

    const pixRefund = await controller.execute(payload);

    logger.info('PixRefund cancel.', { pixRefund });

    return {
      ctx,
      value: pixRefund,
    };
  }
}
