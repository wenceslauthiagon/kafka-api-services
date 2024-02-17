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
  GetWithdrawalsController,
  GetWithdrawalsRequest,
  GetWithdrawalsResponse,
} from '@zro/payments-gateway/interface';

export type GetWithdrawalsKafkaRequest = KafkaMessage<GetWithdrawalsRequest>;

export type GetWithdrawalsKafkaResponse = KafkaResponse<GetWithdrawalsResponse>;

/**
 * Get withdrawals controller.
 */
@Controller()
@MicroserviceController()
export class GetWithdrawalsMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetWithdrawals.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WITHDRAWAL.GET_ALL)
  async execute(
    @LoggerParam(GetWithdrawalsMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetWithdrawalsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWithdrawalsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWithdrawalsRequest(message);

    logger.info('Get withdrawals.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetWithdrawals controller.
    const controller = new GetWithdrawalsController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get withdrawals response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
