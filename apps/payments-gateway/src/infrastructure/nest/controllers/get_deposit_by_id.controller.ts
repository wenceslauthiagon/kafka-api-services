import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
} from '@zro/common';
import { PaymentsGatewayAxiosService } from '@zro/payments-gateway/infrastructure';
import { KAFKA_TOPICS } from '@zro/payments-gateway/infrastructure';
import {
  GetDepositByIdController,
  GetTransactionByIdRequest,
  TransactionResponseItem,
} from '@zro/payments-gateway/interface';

export type GetDepositByIdKafkaRequest =
  KafkaMessage<GetTransactionByIdRequest>;

export type GetDepositByIdKafkaResponse =
  KafkaResponse<TransactionResponseItem>;

/**
 * Get deposit by id controller.
 */
@Controller()
@MicroserviceController()
export class GetDepositByIdMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetDepositById.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DEPOSIT.GET_BY_ID)
  async execute(
    @LoggerParam(GetDepositByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetTransactionByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetDepositByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetTransactionByIdRequest(message);

    logger.info('Get deposit by id.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetDepositById controller.
    const controller = new GetDepositByIdController(logger, axiosInstance);

    const deposit = await controller.execute(payload);

    logger.info('Deposit response.', { deposit });

    return {
      ctx,
      value: deposit,
    };
  }
}
