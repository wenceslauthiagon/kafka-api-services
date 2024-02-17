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
  GetDevolutionsController,
  GetDevolutionsRequest,
  GetDevolutionsResponse,
} from '@zro/payments-gateway/interface';

export type GetDevolutionsKafkaRequest = KafkaMessage<GetDevolutionsRequest>;

export type GetDevolutionsKafkaResponse = KafkaResponse<GetDevolutionsResponse>;

/**
 * Get devolutions controller.
 */
@Controller()
@MicroserviceController()
export class GetDevolutionsMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetDevolutions.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DEVOLUTION.GET_ALL)
  async execute(
    @LoggerParam(GetDevolutionsMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetDevolutionsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetDevolutionsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetDevolutionsRequest(message);

    logger.info('Get devolutions.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetDevolutions controller.
    const controller = new GetDevolutionsController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get devolutions response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
