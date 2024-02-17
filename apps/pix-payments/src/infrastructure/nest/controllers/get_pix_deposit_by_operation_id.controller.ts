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
  GetPixDepositByOperationIdController,
  GetPixDepositByOperationIdRequest,
  GetPixDepositByOperationIdResponse,
} from '@zro/pix-payments/interface';

export type GetPixDepositByOperationIdKafkaRequest =
  KafkaMessage<GetPixDepositByOperationIdRequest>;

export type GetPixDepositByOperationIdKafkaResponse =
  KafkaResponse<GetPixDepositByOperationIdResponse>;

/**
 * Get deposit by operation id controller.
 */
@Controller()
@MicroserviceController()
export class GetPixDepositByOperationIdMicroserviceController {
  /**
   * Consumer of GetPixDepositByOperationId.
   *
   * @param depositRepository Deposit repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEPOSIT.GET_BY_OPERATION_ID)
  async execute(
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @LoggerParam(GetPixDepositByOperationIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPixDepositByOperationIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPixDepositByOperationIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPixDepositByOperationIdRequest(message);

    logger.info('Get deposit by operation id from user.', {
      userId: payload.userId,
    });

    // Get GetPixDepositByOperationId controller.
    const controller = new GetPixDepositByOperationIdController(
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
