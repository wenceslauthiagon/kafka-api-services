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
  GetCompanyController,
  GetCompanyRequest,
  GetCompanyResponse,
} from '@zro/payments-gateway/interface';

export type GetCompanyKafkaRequest = KafkaMessage<GetCompanyRequest>;

export type GetCompanyKafkaResponse = KafkaResponse<GetCompanyResponse>;

/**
 * Get company controller.
 */
@Controller()
@MicroserviceController()
export class GetCompanyMicroserviceController {
  constructor(
    private readonly paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {}

  /**
   * Consumer of GetCompany.
   *
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.COMPANY.GET_COMPANY)
  async execute(
    @LoggerParam(GetCompanyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetCompanyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCompanyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCompanyRequest(message);

    logger.info('Get company.', { payload });

    const axiosInstance = this.paymentsGatewayAxiosService.create({
      headers: {
        'WALLET-ID': payload.wallet_id,
      },
    });

    // Get GetCompany controller.
    const controller = new GetCompanyController(logger, axiosInstance);

    const company = await controller.execute(payload);

    logger.info('Company response.', { company });

    return {
      ctx,
      value: company,
    };
  }
}
