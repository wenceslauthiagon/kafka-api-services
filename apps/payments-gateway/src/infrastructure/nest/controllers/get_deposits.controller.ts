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
  GetDepositsController,
  GetDepositsRequest,
  GetDepositsResponse,
} from '@zro/payments-gateway/interface';

export type GetDepositsKafkaRequest = KafkaMessage<GetDepositsRequest>;

export type GetDepositsKafkaResponse = KafkaResponse<GetDepositsResponse>;

/**
 * Get deposits controller.
 */
@Controller()
@MicroserviceController()
export class GetDepositsMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetDeposits.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DEPOSIT.GET_ALL)
  async execute(
    @LoggerParam(GetDepositsMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetDepositsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetDepositsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetDepositsRequest(message);

    logger.info('Get deposits.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetDeposits controller.
    const controller = new GetDepositsController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Get deposits response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
