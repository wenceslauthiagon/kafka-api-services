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
  GetRefundsController,
  GetRefundsRequest,
  GetRefundsResponse,
} from '@zro/payments-gateway/interface';

export type GetRefundsKafkaRequest = KafkaMessage<GetRefundsRequest>;

export type GetRefundsKafkaResponse = KafkaResponse<GetRefundsResponse>;

/**
 * Get refunds controller.
 */
@Controller()
@MicroserviceController()
export class GetRefundsMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetRefunds.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REFUND.GET_ALL)
  async execute(
    @LoggerParam(GetRefundsMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetRefundsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetRefundsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetRefundsRequest(message);

    logger.info('Get refunds.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetRefunds controller.
    const controller = new GetRefundsController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get refunds response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
