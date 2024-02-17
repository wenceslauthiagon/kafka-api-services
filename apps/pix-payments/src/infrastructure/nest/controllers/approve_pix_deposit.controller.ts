import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  RepositoryParam,
  EventEmitterParam,
  KafkaServiceParam,
  MicroserviceController,
} from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import { OperationService } from '@zro/pix-payments/application';
import {
  KAFKA_TOPICS,
  PixDepositDatabaseRepository,
  PixDepositEventKafkaEmitter,
  OperationServiceKafka,
  WarningPixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  ApprovePixDepositController,
  ApprovePixDepositRequest,
  ApprovePixDepositResponse,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type ApprovePixDepositKafkaRequest =
  KafkaMessage<ApprovePixDepositRequest>;

export type ApprovePixDepositKafkaResponse =
  KafkaResponse<ApprovePixDepositResponse>;

/**
 * Approve Pix Deposit controller.
 */
@Controller()
@MicroserviceController()
export class ApprovePixDepositMicroserviceController {
  /**
   * Consumer of approve pix deposit
   *
   * @param depositRepository
   * @param warningPixDepositRepository
   * @param operationService
   * @param eventEmitter
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEPOSIT.APPROVE)
  async execute(
    @LoggerParam(ApprovePixDepositMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(WarningPixDepositDatabaseRepository)
    warningPixDepositRepository: WarningPixDepositRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    eventEmitter: PixDepositEventEmitterControllerInterface,
    @Payload('value') message: ApprovePixDepositRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ApprovePixDepositKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new ApprovePixDepositRequest(message);

    logger.debug('Approve pix deposit.', { payload });

    // Create and call approve pix deposit controller
    const controller = new ApprovePixDepositController(
      logger,
      depositRepository,
      warningPixDepositRepository,
      operationService,
      eventEmitter,
    );

    const pixDeposit = await controller.execute(payload);

    logger.info('Pix deposit approved.', { pixDeposit });

    return {
      ctx,
      value: pixDeposit,
    };
  }
}
