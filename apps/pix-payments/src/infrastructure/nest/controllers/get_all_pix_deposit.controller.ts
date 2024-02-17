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
import { PixDepositRepository } from '@zro/pix-payments/domain';
import {
  GetAllPixDepositController,
  GetAllPixDepositRequest,
  GetAllPixDepositResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetAllPixDepositKafkaRequest =
  KafkaMessage<GetAllPixDepositRequest>;

export type GetAllPixDepositKafkaResponse =
  KafkaResponse<GetAllPixDepositResponse>;

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPixDepositMicroserviceController {
  /**
   * Consumer of get deposits.
   *
   * @param depositRepository Deposit repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEPOSIT.GET_ALL)
  async execute(
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @LoggerParam(GetAllPixDepositMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPixDepositRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPixDepositKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPixDepositRequest(message);

    // Create and call get deposits controller.
    const controller = new GetAllPixDepositController(
      logger,
      depositRepository,
    );

    // Get deposits
    const deposits = await controller.execute(payload);

    logger.info('Deposits found.', { deposits });

    return {
      ctx,
      value: deposits,
    };
  }
}
