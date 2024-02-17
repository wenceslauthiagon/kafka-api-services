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
  GetOrderByIdController,
  GetOrderByIdRequest,
  GetOrderByIdResponse,
} from '@zro/payments-gateway/interface';

export type GetOrderByIdKafkaRequest = KafkaMessage<GetOrderByIdRequest>;

export type GetOrderByIdKafkaResponse = KafkaResponse<GetOrderByIdResponse>;

/**
 * Get devolution by id controller.
 */
@Controller()
@MicroserviceController()
export class GetOrderByIdMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetOrderById.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ORDER.GET_BY_ID)
  async execute(
    @LoggerParam(GetOrderByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetOrderByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOrderByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetOrderByIdRequest(message);

    logger.info('Get order by id.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetOrderById controller.
    const controller = new GetOrderByIdController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get order by id response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
