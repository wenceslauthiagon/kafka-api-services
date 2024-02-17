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
import { BankRepository } from '@zro/banking/domain';
import {
  BankEventEmitterControllerInterface,
  UpdateBankController,
  UpdateBankRequest,
  UpdateBankResponse,
} from '@zro/banking/interface';
import {
  BankDatabaseRepository,
  KAFKA_TOPICS,
  BankEventKafkaEmitter,
} from '@zro/banking/infrastructure';

export type UpdateBankKafkaRequest = KafkaMessage<UpdateBankRequest>;

export type UpdateBankKafkaResponse = KafkaResponse<UpdateBankResponse>;

/**
 * Update bank controller.
 */
@Controller()
@MicroserviceController()
export class UpdateBankMicroserviceController {
  /**
   * Parse update bank message and call update bank controller.
   *
   * @param bankRepository Bank repository.
   * @param eventEmitter Bank event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANK.UPDATE)
  async execute(
    @RepositoryParam(BankDatabaseRepository)
    bankRepository: BankRepository,
    @EventEmitterParam(BankEventKafkaEmitter)
    eventEmitter: BankEventEmitterControllerInterface,
    @LoggerParam(UpdateBankMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateBankRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateBankKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateBankRequest(message);

    logger.info('Update bank.', { payload });

    // Create update bank controller.
    const controller = new UpdateBankController(
      logger,
      bankRepository,
      eventEmitter,
    );

    // Update bank.
    const result = await controller.execute(payload);

    logger.info('Bank updated.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
