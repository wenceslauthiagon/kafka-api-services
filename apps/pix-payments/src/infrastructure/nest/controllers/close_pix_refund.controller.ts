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
} from '@zro/common';
import { PixRefundRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixRefundDatabaseRepository,
  PixRefundEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  ClosePixRefundRequest,
  ClosePixRefundResponse,
  ClosePixRefundController,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type ClosePixRefundKafkaRequest = KafkaMessage<ClosePixRefundRequest>;

export type ClosePixRefundKafkaResponse = KafkaResponse<ClosePixRefundResponse>;

/**
 * Close PixRefund controller.
 */
@Controller()
@MicroserviceController()
export class ClosePixRefundMicroserviceController {
  /**
   * Consumer of open infraction.
   *
   * @param refundRepository PixRefund repository.
   * @param eventEmitter PixRefund event emitter.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_REFUND.CLOSE)
  async execute(
    @LoggerParam(ClosePixRefundMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixRefundDatabaseRepository)
    refundRepository: PixRefundRepository,
    @EventEmitterParam(PixRefundEventKafkaEmitter)
    eventEmitter: PixRefundEventEmitterControllerInterface,
    @Payload('value') message: ClosePixRefundRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ClosePixRefundKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ClosePixRefundRequest(message);

    // close refund controller.
    const controller = new ClosePixRefundController(
      logger,
      refundRepository,
      eventEmitter,
    );

    const pixRefund = await controller.execute(payload);

    logger.info('PixRefund closed.', { pixRefund });

    return {
      ctx,
      value: pixRefund,
    };
  }
}
