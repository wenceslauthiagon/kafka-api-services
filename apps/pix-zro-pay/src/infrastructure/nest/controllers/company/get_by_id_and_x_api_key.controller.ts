import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { CompanyRepository } from '@zro/pix-zro-pay/domain';
import {
  CompanyDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/pix-zro-pay/infrastructure';
import {
  GetCompanyByIdAndXApiKeyRequest,
  GetCompanyByIdAndXApiKeyResponse,
  GetCompanyByIdAndXApiKeyController,
} from '@zro/pix-zro-pay/interface';

export type GetCompanyByIdAndXApiKeyKafkaRequest =
  KafkaMessage<GetCompanyByIdAndXApiKeyRequest>;

export type GetCompanyByIdAndXApiKeyKafkaResponse =
  KafkaResponse<GetCompanyByIdAndXApiKeyResponse>;

/**
 * Company controller.
 */
@Controller()
@MicroserviceController()
export class GetCompanyByIdAndXApiKeyMicroserviceController {
  /**
   * Consumer of get company.
   *
   * @param companyRepository Company repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.COMPANY.GET_BY_ID_AND_X_API_KEY)
  async execute(
    @RepositoryParam(CompanyDatabaseRepository)
    companyRepository: CompanyRepository,
    @LoggerParam(GetCompanyByIdAndXApiKeyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetCompanyByIdAndXApiKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCompanyByIdAndXApiKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCompanyByIdAndXApiKeyRequest(message);

    logger.info('Get company by id and xApiKey.', { payload });

    // Create and call get company by id and xApiKey controller.
    const controller = new GetCompanyByIdAndXApiKeyController(
      logger,
      companyRepository,
    );

    // Get company by id and xApiKey
    const company = await controller.execute(payload);

    logger.info('Company found.', { company });

    return {
      ctx,
      value: company,
    };
  }
}
