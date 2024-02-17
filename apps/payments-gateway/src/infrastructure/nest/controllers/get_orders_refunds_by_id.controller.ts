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
  GetOrderRefundsByIdController,
  GetOrderRefundsByIdRequest,
  GetOrderRefundsByIdResponse,
} from '@zro/payments-gateway/interface';

export type GetOrderRefundsByIdKafkaRequest =
  KafkaMessage<GetOrderRefundsByIdRequest>;

export type GetOrdersRefundsByIdKafkaResponse =
  KafkaResponse<GetOrderRefundsByIdResponse>;

/**
 * Get order refunds by id controller.
 */
@Controller()
@MicroserviceController()
export class GetOrderRefundsByIdMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetOrderRefundsById.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ORDER_REFUNDS.GET_BY_ID)
  async execute(
    @LoggerParam(GetOrderRefundsByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetOrderRefundsByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOrdersRefundsByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    const payload = new GetOrderRefundsByIdRequest(message);

    logger.info('Get order refunds by id.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    const controller = new GetOrderRefundsByIdController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get order refunds by id response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
