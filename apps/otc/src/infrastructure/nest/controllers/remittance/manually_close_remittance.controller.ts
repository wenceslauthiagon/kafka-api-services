import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { RemittanceRepository } from '@zro/otc/domain';
import {
  ManuallyCloseRemittanceController,
  ManuallyCloseRemittanceRequest,
  ManuallyCloseRemittanceResponse,
  RemittanceEventEmitterControllerInterface,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  RemittanceDatabaseRepository,
  RemittanceEventKafkaEmitter,
} from '@zro/otc/infrastructure';

export type ManuallyCloseRemittanceKafkaRequest =
  KafkaMessage<ManuallyCloseRemittanceRequest>;

export type ManuallyCloseRemittanceKafkaResponse =
  KafkaResponse<ManuallyCloseRemittanceResponse>;

/**
 * Manually Close Remittance controller.
 */
@Controller()
@MicroserviceController()
export class ManuallyCloseRemittanceMicroserviceController {
  /**
   * Consumer of close remittance.
   *
   * @param remittanceRepository Remittance repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @param remittanceEventEmitter Remittance event emitter.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE.MANUALLY_CLOSE_REMITTANCE)
  async execute(
    @RepositoryParam(RemittanceDatabaseRepository)
    remittanceRepository: RemittanceRepository,
    @LoggerParam(ManuallyCloseRemittanceMicroserviceController)
    logger: Logger,
    @Payload('value') message: ManuallyCloseRemittanceRequest,
    @EventEmitterParam(RemittanceEventKafkaEmitter)
    remittanceEventEmitter: RemittanceEventEmitterControllerInterface,
    @Ctx() ctx: KafkaContext,
  ): Promise<ManuallyCloseRemittanceKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ManuallyCloseRemittanceRequest(message);

    // Create and call manually close remittance controller.
    const controller = new ManuallyCloseRemittanceController(
      logger,
      remittanceRepository,
      remittanceEventEmitter,
    );

    // Manually close remittance
    const remittance = await controller.execute(payload);

    logger.info('Manually Closed Remittance.', { remittance });

    return {
      ctx,
      value: remittance,
    };
  }
}
