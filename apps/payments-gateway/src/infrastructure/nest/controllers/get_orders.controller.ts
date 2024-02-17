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
  GetOrdersController,
  GetOrdersRequest,
  GetOrdersResponse,
} from '@zro/payments-gateway/interface';

export type GetOrdersKafkaRequest = KafkaMessage<GetOrdersRequest>;

export type GetOrdersKafkaResponse = KafkaResponse<GetOrdersResponse>;

/**
 * Get orders controller.
 */
@Controller()
@MicroserviceController()
export class GetOrdersMicroserviceController {
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
  @KafkaMessagePattern(KAFKA_TOPICS.ORDER.GET_ALL)
  async execute(
    @LoggerParam(GetOrdersMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetOrdersRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOrdersKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetOrdersRequest(message);

    logger.info('Get orders.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetOrders controller.
    const controller = new GetOrdersController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get orders response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
