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
  GetWithdrawReceiptsBankAccountsController,
  GetWithdrawReceiptsBankAccountsRequest,
  GetWithdrawReceiptsBankAccountsResponse,
} from '@zro/payments-gateway/interface';

export type GetWithdrawReceiptsBankAccountsKafkaRequest =
  KafkaMessage<GetWithdrawReceiptsBankAccountsRequest>;

export type GetWithdrawReceiptsBankAccountsKafkaResponse =
  KafkaResponse<GetWithdrawReceiptsBankAccountsResponse>;

/**
 * Get withdraw receipts bank accounts controller.
 */
@Controller()
@MicroserviceController()
export class GetSupportsWithdrawReceiptsBankAccountsByIdMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetWithdrawReceiptsBankAccounts.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SUPPORTS.WITHDRAW)
  async execute(
    @LoggerParam(
      GetSupportsWithdrawReceiptsBankAccountsByIdMicroserviceController,
    )
    logger: Logger,
    @Payload('value') message: GetWithdrawReceiptsBankAccountsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWithdrawReceiptsBankAccountsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWithdrawReceiptsBankAccountsRequest(message);

    logger.info('Get withdrawals.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetWithdrawReceiptsBankAccounts controller.
    const controller = new GetWithdrawReceiptsBankAccountsController(
      logger,
      axiosInstance,
    );

    const response = await controller.execute(payload);

    logger.info('Get withdraw receipts bank accounts response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
