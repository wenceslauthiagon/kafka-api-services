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
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
  OperationServiceKafka,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  ClosePixInfractionRequest,
  ClosePixInfractionResponse,
  ClosePixInfractionController,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type ClosePixInfractionKafkaRequest =
  KafkaMessage<ClosePixInfractionRequest>;

export type ClosePixInfractionKafkaResponse =
  KafkaResponse<ClosePixInfractionResponse>;

/**
 * Close Infraction controller.
 */
@Controller()
@MicroserviceController()
export class ClosePixInfractionMicroserviceController {
  /**
   * Consumer of close infraction.
   *
   * @param infractionRepository Infraction repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param eventEmitter Infraction event emitter.
   * @param operationService Operation service.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_INFRACTION.CLOSE)
  async execute(
    @LoggerParam(ClosePixInfractionMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @Payload('value') message: ClosePixInfractionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ClosePixInfractionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ClosePixInfractionRequest(message);

    // close infraction controller.
    const controller = new ClosePixInfractionController(
      logger,
      infractionRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
      operationService,
    );

    const infraction = await controller.execute(payload);

    logger.info('Infraction closed.', { infraction });

    return {
      ctx,
      value: infraction,
    };
  }
}
