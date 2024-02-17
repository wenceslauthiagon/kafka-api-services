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
  PaymentsGatewayAxiosService,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetRefundReceiptsBankAccountsController,
  GetRefundReceiptsBankAccountsRequest,
  GetRefundReceiptsBankAccountsResponse,
} from '@zro/payments-gateway/interface';

export type GetRefundReceiptsBankAccountsKafkaRequest =
  KafkaMessage<GetRefundReceiptsBankAccountsRequest>;

export type GetRefundReceiptsBankAccountsKafkaResponse =
  KafkaResponse<GetRefundReceiptsBankAccountsResponse>;

/**
 * Get refund receipts bank accounts controller.
 */
@Controller()
@MicroserviceController()
export class GetSupportsRefundReceiptsBankAccountsByIdMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetRefundReceiptsBankAccounts.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SUPPORTS.REFUND)
  async execute(
    @LoggerParam(
      GetSupportsRefundReceiptsBankAccountsByIdMicroserviceController,
    )
    logger: Logger,
    @Payload('value') message: GetRefundReceiptsBankAccountsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetRefundReceiptsBankAccountsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetRefundReceiptsBankAccountsRequest(message);

    logger.info('Get withdrawals.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetRefundReceiptsBankAccounts controller.
    const controller = new GetRefundReceiptsBankAccountsController(
      logger,
      axiosInstance,
    );

    const response = await controller.execute(payload);

    logger.info('Get refund receipts bank accounts response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
