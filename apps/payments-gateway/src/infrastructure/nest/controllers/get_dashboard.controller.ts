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
import {
  KAFKA_TOPICS,
  PaymentsGatewayAxiosService,
} from '@zro/payments-gateway/infrastructure';
import {
  GetDashboardController,
  GetDashboardRequest,
  GetDashboardResponse,
} from '@zro/payments-gateway/interface';

export type GetDashboardKafkaRequest = KafkaMessage<GetDashboardRequest>;

export type GetDashboardKafkaResponse = KafkaResponse<GetDashboardResponse>;

/**
 * Get dashboard controller.
 */
@Controller()
@MicroserviceController()
export class GetDashboardMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetDashboard.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DASHBOARD.GET_ALL)
  async execute(
    @LoggerParam(GetDashboardMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetDashboardRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetDashboardKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetDashboardRequest(message);

    logger.info('Get dashboard.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetDashboard controller.
    const controller = new GetDashboardController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get dashboard response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
