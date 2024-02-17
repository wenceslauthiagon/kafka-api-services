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
  GetValidationKycCountController,
  GetValidationKycCountRequest,
  GetValidationKycCountResponse,
} from '@zro/payments-gateway/interface';

export type GetValidationKycCountKafkaRequest =
  KafkaMessage<GetValidationKycCountRequest>;

export type GetValidationKycCountKafkaResponse =
  KafkaResponse<GetValidationKycCountResponse>;

/**
 * Get validation kyc count controller.
 */
@Controller()
@MicroserviceController()
export class GetValidationKycCountMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetValidationKycCount.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.VALIDATION.KYC_COUNT)
  async execute(
    @LoggerParam(GetValidationKycCountMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetValidationKycCountRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetValidationKycCountKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetValidationKycCountRequest(message);

    logger.info('Get validation kyc count.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetValidationKycCountController controller.
    const controller = new GetValidationKycCountController(
      logger,
      axiosInstance,
    );

    const response = await controller.execute(payload);

    logger.info('Get validation kyc count response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
