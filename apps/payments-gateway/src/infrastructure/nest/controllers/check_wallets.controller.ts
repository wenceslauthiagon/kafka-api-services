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
  CheckWalletsController,
  CheckWalletsRequest,
  CheckWalletsResponse,
} from '@zro/payments-gateway/interface';

export type CheckWalletsKafkaRequest = KafkaMessage<CheckWalletsRequest>;

export type CheckWalletsKafkaResponse = KafkaResponse<CheckWalletsResponse>;

/**
 * Check wallets controller.
 */
@Controller()
@MicroserviceController()
export class CheckWalletsMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of CheckWallets.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET.CHECK)
  async execute(
    @LoggerParam(CheckWalletsMicroserviceController)
    logger: Logger,
    @Payload('value') message: CheckWalletsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CheckWalletsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CheckWalletsRequest(message);

    logger.info('Check wallets.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create();

    // Check CheckWallets controller.
    const controller = new CheckWalletsController(logger, axiosInstance);

    const response = await controller.execute(payload);

    logger.info('Check wallets response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
