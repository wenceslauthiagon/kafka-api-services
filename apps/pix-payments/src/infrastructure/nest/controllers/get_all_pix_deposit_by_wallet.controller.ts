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
  GetAllPixDepositByWalletController,
  GetAllPixDepositByWalletRequest,
  GetAllPixDepositByWalletResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetAllPixDepositByWalletKafkaRequest =
  KafkaMessage<GetAllPixDepositByWalletRequest>;

export type GetAllPixDepositByWalletKafkaResponse =
  KafkaResponse<GetAllPixDepositByWalletResponse>;

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPixDepositByWalletMicroserviceController {
  /**
   * Consumer of get deposits.
   *
   * @param depositRepository Deposit repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEPOSIT.GET_ALL_BY_WALLET)
  async execute(
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @LoggerParam(GetAllPixDepositByWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPixDepositByWalletRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPixDepositByWalletKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPixDepositByWalletRequest(message);

    // Create and call get deposits controller.
    const controller = new GetAllPixDepositByWalletController(
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
