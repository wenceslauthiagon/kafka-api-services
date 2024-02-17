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
  OpenPixInfractionRequest,
  OpenPixInfractionResponse,
  OpenPixInfractionController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type OpenPixInfractionKafkaRequest =
  KafkaMessage<OpenPixInfractionRequest>;

export type OpenPixInfractionKafkaResponse =
  KafkaResponse<OpenPixInfractionResponse>;

/**
 * Open Infraction controller.
 */
@Controller()
@MicroserviceController()
export class OpenPixInfractionMicroserviceController {
  /**
   * Consumer of open infraction.
   *
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_INFRACTION.OPEN)
  async execute(
    @LoggerParam(OpenPixInfractionMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    @Payload('value') message: OpenPixInfractionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<OpenPixInfractionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new OpenPixInfractionRequest(message);

    // open infraction controller.
    const controller = new OpenPixInfractionController(
      logger,
      infractionRepository,
      eventEmitter,
    );

    const infraction = await controller.execute(payload);

    logger.info('Infraction updated.', { infraction });

    return {
      ctx,
      value: infraction,
    };
  }
}
