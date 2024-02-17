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
import { PixInfractionRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPixInfractionController,
  CancelPixInfractionRequest,
  CancelPixInfractionResponse,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CancelPixInfractionKafkaRequest =
  KafkaMessage<CancelPixInfractionRequest>;

export type CancelPixInfractionKafkaResponse =
  KafkaResponse<CancelPixInfractionResponse>;

/**
 * Cancel Infraction controller.
 */
@Controller()
@MicroserviceController()
export class CancelPixInfractionMicroserviceController {
  /**
   * Consumer of cancel infraction.
   *
   * @param logger Request logger.
   * @param infractionRepository Infraction repository.
   * @param infractionEventEmitter Infraction event emitter.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_INFRACTION.CANCEL)
  async execute(
    @LoggerParam(CancelPixInfractionMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    infractionEventEmitter: PixInfractionEventEmitterControllerInterface,
    @Payload('value') message: CancelPixInfractionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelPixInfractionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CancelPixInfractionRequest(message);

    // Create and call cancel infraction controller.
    const controller = new CancelPixInfractionController(
      logger,
      infractionRepository,
      infractionEventEmitter,
    );

    const infraction = await controller.execute(payload);

    logger.info('Infraction canceled.', { infraction });

    return {
      ctx,
      value: infraction,
    };
  }
}
