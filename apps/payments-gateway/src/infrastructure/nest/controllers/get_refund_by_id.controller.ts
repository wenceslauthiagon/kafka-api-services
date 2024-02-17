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
  GetRefundByIdController,
  GetTransactionByIdRequest,
  TransactionResponseItem,
} from '@zro/payments-gateway/interface';

export type GetRefundByIdKafkaRequest = KafkaMessage<GetTransactionByIdRequest>;

export type GetRefundByIdKafkaResponse = KafkaResponse<TransactionResponseItem>;

/**
 * Get refund by id controller.
 */
@Controller()
@MicroserviceController()
export class GetRefundByIdMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetRefundById.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REFUND.GET_BY_ID)
  async execute(
    @LoggerParam(GetRefundByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetTransactionByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetRefundByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetTransactionByIdRequest(message);

    logger.info('Get refund by id.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetRefundById controller.
    const controller = new GetRefundByIdController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get refund by id response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
