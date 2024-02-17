import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaResponse,
  KafkaMessage,
  KafkaMessagePattern,
} from '@zro/common';
import { ReportUserLegalRepresentorRepository } from '@zro/reports/domain';
import {
  KAFKA_TOPICS,
  ReportUserLegalRepresentorDatabaseRepository,
} from '@zro/reports/infrastructure';
import {
  CreateReportUserLegalRepresentorRequest,
  CreateReportUserLegalRepresentorResponse,
  CreateReportUserLegalRepresentorController,
} from '@zro/reports/interface';

export type CreateReportUserLegalRepresentorKafkaRequest =
  KafkaMessage<CreateReportUserLegalRepresentorRequest>;

export type CreateReportUserLegalRepresentorKafkaResponse =
  KafkaResponse<CreateReportUserLegalRepresentorResponse>;

/**
 * Reports controller.
 */
@Controller()
@MicroserviceController()
export class CreateReportUserLegalRepresentorMicroserviceController {
  /**
   * Consumer of create report userLegalRepresentor.
   *
   * @param reportUserLegalRepresentorRepository Report userLegalRepresentor repository.
   * @param operationService UserLegalRepresentor Service
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REPORT_USER_LEGAL_REPRESENTOR.CREATE)
  async execute(
    @RepositoryParam(ReportUserLegalRepresentorDatabaseRepository)
    reportUserLegalRepresentorRepository: ReportUserLegalRepresentorRepository,
    @LoggerParam(CreateReportUserLegalRepresentorMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateReportUserLegalRepresentorRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateReportUserLegalRepresentorKafkaResponse> {
    logger.debug('Received message.', { value: message });

    const payload = new CreateReportUserLegalRepresentorRequest(message);

    logger.info('Create report userLegalRepresentor.', { payload });

    const controller = new CreateReportUserLegalRepresentorController(
      logger,
      reportUserLegalRepresentorRepository,
    );

    const reportUserLegalRepresentor = await controller.execute(payload);

    logger.info('Report userLegalRepresentor created.', {
      reportUserLegalRepresentor,
    });

    return {
      ctx,
      value: reportUserLegalRepresentor,
    };
  }
}
