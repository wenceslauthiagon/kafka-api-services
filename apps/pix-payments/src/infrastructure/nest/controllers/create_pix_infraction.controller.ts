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
import {
  PixInfractionRepository,
  PaymentRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixInfractionDatabaseRepository,
  PaymentDatabaseRepository,
  PixInfractionEventKafkaEmitter,
  PixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  CreatePixInfractionController,
  CreatePixInfractionRequest,
  CreatePixInfractionResponse,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreatePixInfractionKafkaRequest =
  KafkaMessage<CreatePixInfractionRequest>;

export type CreatePixInfractionKafkaResponse =
  KafkaResponse<CreatePixInfractionResponse>;

/**
 * Create Infraction controller.
 */
@Controller()
@MicroserviceController()
export class CreatePixInfractionMicroserviceController {
  /**
   * Consumer of create infraction.
   *
   * @param infractionRepository Infraction repository.
   * @param paymentRepository Payment repository.
   * @param eventEmitter Infraction event emitter.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_INFRACTION.CREATE)
  async execute(
    @LoggerParam(CreatePixInfractionMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    @Payload('value') message: CreatePixInfractionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreatePixInfractionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreatePixInfractionRequest(message);

    // Create and call create infraction controller.
    const controller = new CreatePixInfractionController(
      logger,
      paymentRepository,
      infractionRepository,
      eventEmitter,
      devolutionRepository,
    );

    const infraction = await controller.execute(payload);

    logger.info('Infraction created.', { infraction });

    return {
      ctx,
      value: infraction,
    };
  }
}
