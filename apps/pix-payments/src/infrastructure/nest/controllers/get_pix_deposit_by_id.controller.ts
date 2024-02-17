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
  KAFKA_TOPICS,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDepositByIdController,
  GetPixDepositByIdRequest,
  GetPixDepositByIdResponse,
} from '@zro/pix-payments/interface';

export type GetPixDepositByIdKafkaRequest =
  KafkaMessage<GetPixDepositByIdRequest>;

export type GetPixDepositByIdKafkaResponse =
  KafkaResponse<GetPixDepositByIdResponse>;

/**
 * Get deposit by id controller.
 */
@Controller()
@MicroserviceController()
export class GetPixDepositByIdMicroserviceController {
  /**
   * Consumer of GetPixDepositById.
   *
   * @param depositRepository Deposit repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEPOSIT.GET_BY_ID)
  async execute(
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @LoggerParam(GetPixDepositByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPixDepositByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPixDepositByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPixDepositByIdRequest(message);

    logger.info('Get deposit by id.', {
      id: payload.id,
    });

    // Get GetPixDepositById controller.
    const controller = new GetPixDepositByIdController(
      logger,
      depositRepository,
    );

    const deposit = await controller.execute(payload);

    logger.info('PixDeposit response.', { deposit });

    return {
      ctx,
      value: deposit,
    };
  }
}
