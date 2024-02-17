import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  KAFKA_TOPICS,
  WarningPixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { WarningPixDepositRepository } from '@zro/pix-payments/domain';
import {
  GetAllWarningPixDepositController,
  GetAllWarningPixDepositRequest,
  GetAllWarningPixDepositResponse,
} from '@zro/pix-payments/interface';

export type GetAllWarningPixDepositKafkaRequest =
  KafkaMessage<GetAllWarningPixDepositRequest>;

export type GetAllWarningPixDepositKafkaResponse =
  KafkaResponse<GetAllWarningPixDepositResponse>;

/**
 * Warning Pix Deposit controller.
 */
@Controller()
@MicroserviceController()
export class GetAllWarningPixDepositMicroserviceController {
  /**
   * Consumer of get payments.
   *
   * @param warningPixDepositRepository Warning Pix Deposit repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WARNING_PIX_DEPOSIT.GET_ALL)
  async execute(
    @RepositoryParam(WarningPixDepositDatabaseRepository)
    warningPixDepositRepository: WarningPixDepositRepository,
    @LoggerParam(GetAllWarningPixDepositMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllWarningPixDepositRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllWarningPixDepositKafkaResponse> {
    logger.debug('Received message.', { value: message });
    // Parse kafka message.
    const payload = new GetAllWarningPixDepositRequest(message);

    // Create and call get warning pix deposits controller.
    const controller = new GetAllWarningPixDepositController(
      logger,
      warningPixDepositRepository,
    );

    // Get warning Pix deposits
    const warningPixDeposits = await controller.execute(payload);

    logger.info('Warning Pix Deposits found.', { warningPixDeposits });

    return {
      ctx,
      value: warningPixDeposits,
    };
  }
}
