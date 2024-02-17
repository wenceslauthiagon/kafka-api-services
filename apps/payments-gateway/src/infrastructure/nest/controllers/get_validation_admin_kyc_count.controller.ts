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
  GetValidationAdminKycCountController,
  GetValidationAdminKycCountRequest,
  GetValidationAdminKycCountResponse,
} from '@zro/payments-gateway/interface';

export type GetValidationAdminKycCountKafkaRequest =
  KafkaMessage<GetValidationAdminKycCountRequest>;

export type GetValidationAdminKycCountKafkaResponse =
  KafkaResponse<GetValidationAdminKycCountResponse>;

/**
 * Get validation admin kyc count controller.
 */
@Controller()
@MicroserviceController()
export class GetValidationAdminKycCountMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetValidationAdminKycCount.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.VALIDATION.ADMIN_KYC_COUNT)
  async execute(
    @LoggerParam(GetValidationAdminKycCountMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetValidationAdminKycCountRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetValidationAdminKycCountKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetValidationAdminKycCountRequest(message);

    logger.info('Get validation admin kyc count.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetValidationAdminKycCountController controller.
    const controller = new GetValidationAdminKycCountController(
      logger,
      axiosInstance,
    );

    const response = await controller.execute(payload);

    logger.info('Get validation admin kyc count response.', { response });

    return {
      ctx,
      value: response,
    };
  }
}
