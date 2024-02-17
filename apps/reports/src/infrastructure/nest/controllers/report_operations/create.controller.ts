import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaResponse,
} from '@zro/common';
import { ReportOperationRepository } from '@zro/reports/domain';
import {
  KAFKA_TOPICS,
  ReportOperationDatabaseRepository,
} from '@zro/reports/infrastructure';
import {
  CreateReportOperationRequest,
  CreateReportOperationResponse,
  CreateReportOperationController,
} from '@zro/reports/interface';

export type CreateReportOperationKafkaRequest =
  KafkaMessage<CreateReportOperationRequest>;

export type CreateReportOperationKafkaResponse =
  KafkaResponse<CreateReportOperationResponse>;

/**
 * Reports controller.
 */
@Controller()
@MicroserviceController()
export class CreateReportOperationMicroserviceController {
  /**
   * Consumer of create report operation.
   *
   * @param reportOperationRepository ReportOperation repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REPORT_OPERATION.CREATE)
  async execute(
    @RepositoryParam(ReportOperationDatabaseRepository)
    reportOperationRepository: ReportOperationRepository,
    @LoggerParam(CreateReportOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateReportOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateReportOperationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    const payload = new CreateReportOperationRequest(message);

    logger.info('Create report operation.', { payload });

    const controller = new CreateReportOperationController(
      logger,
      reportOperationRepository,
    );

    const reportOperation = await controller.execute(payload);

    logger.info('Report operation created.', { reportOperation });

    return {
      ctx,
      value: reportOperation,
    };
  }
}
