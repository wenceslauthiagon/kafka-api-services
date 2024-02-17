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
  GetWithdrawalByIdController,
  GetTransactionByIdRequest,
  TransactionResponseItem,
} from '@zro/payments-gateway/interface';

export type GetWithdrawalByIdKafkaRequest =
  KafkaMessage<GetTransactionByIdRequest>;

export type GetWithdrawalByIdKafkaResponse =
  KafkaResponse<TransactionResponseItem>;

/**
 * Get withdrawal by id controller.
 */
@Controller()
@MicroserviceController()
export class GetWithdrawalByIdMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetWithdrawalById.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WITHDRAWAL.GET_BY_ID)
  async execute(
    @LoggerParam(GetWithdrawalByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetTransactionByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWithdrawalByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetTransactionByIdRequest(message);

    logger.info('Get withdrawal by id.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetWithdrawalById controller.
    const controller = new GetWithdrawalByIdController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get withdrawal by id response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
