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
  GetValidationClientKycCountController,
  GetValidationClientKycCountRequest,
  GetValidationClientKycCountResponse,
} from '@zro/payments-gateway/interface';

export type GetValidationClientKycCountKafkaRequest =
  KafkaMessage<GetValidationClientKycCountRequest>;

export type GetValidationClientKycCountKafkaResponse =
  KafkaResponse<GetValidationClientKycCountResponse>;

/**
 * Get validation client kyc count controller.
 */
@Controller()
@MicroserviceController()
export class GetValidationClientKycCountMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetValidationClientKycCount.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.VALIDATION.CLIENT_KYC_COUNT)
  async execute(
    @LoggerParam(GetValidationClientKycCountMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetValidationClientKycCountRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetValidationClientKycCountKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetValidationClientKycCountRequest(message);

    logger.info('Get validation client kyc count.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetValidationClientKycCountController controller.
    const controller = new GetValidationClientKycCountController(
      logger,
      axiosInstance,
    );

    const response = await controller.execute(payload);

    logger.info('Get validation client kyc count response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
