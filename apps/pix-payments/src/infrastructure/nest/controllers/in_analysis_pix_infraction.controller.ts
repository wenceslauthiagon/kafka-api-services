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
  InAnalysisPixInfractionRequest,
  InAnalysisPixInfractionResponse,
  InAnalysisPixInfractionController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type InAnalysisPixInfractionKafkaRequest =
  KafkaMessage<InAnalysisPixInfractionRequest>;

export type InAnalysisPixInfractionKafkaResponse =
  KafkaResponse<InAnalysisPixInfractionResponse>;

/**
 * InAnalysis Infraction controller.
 */
@Controller()
@MicroserviceController()
export class InAnalysisPixInfractionMicroserviceController {
  /**
   * Consumer of open infraction.
   *
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_INFRACTION.IN_ANALYSIS)
  async execute(
    @LoggerParam(InAnalysisPixInfractionMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    @Payload('value') message: InAnalysisPixInfractionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<InAnalysisPixInfractionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new InAnalysisPixInfractionRequest(message);

    // open infraction controller.
    const controller = new InAnalysisPixInfractionController(
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
