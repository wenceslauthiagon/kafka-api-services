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
  GetOrdersRefundsController,
  GetOrdersRefundsRequest,
  GetOrdersRefundsResponse,
} from '@zro/payments-gateway/interface';

export type GetOrdersRefundsKafkaRequest =
  KafkaMessage<GetOrdersRefundsRequest>;

export type GetOrdersRefundsKafkaResponse =
  KafkaResponse<GetOrdersRefundsResponse>;

/**
 * Get orders controller.
 */
@Controller()
@MicroserviceController()
export class GetOrdersRefundsMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetOrders.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ORDER_REFUNDS.GET_ALL)
  async execute(
    @LoggerParam(GetOrdersRefundsMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetOrdersRefundsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOrdersRefundsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    const payload = new GetOrdersRefundsRequest(message);

    logger.info('Get orders refunds.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    const controller = new GetOrdersRefundsController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get orders refunds response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
