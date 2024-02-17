import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
  KafkaResponse,
} from '@zro/common';
import { ReportUserRepository } from '@zro/reports/domain';
import {
  KAFKA_TOPICS,
  OperationServiceKafka,
  ReportUserDatabaseRepository,
  AdminServiceKafka,
} from '@zro/reports/infrastructure';
import {
  CreateReportUserRequest,
  CreateReportUserResponse,
  CreateReportUserController,
} from '@zro/reports/interface';
import { AdminService, OperationService } from '@zro/reports/application';

export type CreateReportUserKafkaRequest =
  KafkaMessage<CreateReportUserRequest>;

export type CreateReportUserKafkaResponse =
  KafkaResponse<CreateReportUserResponse>;

/**
 * Reports controller.
 */
@Controller()
@MicroserviceController()
export class CreateReportUserMicroserviceController {
  /**
   * Consumer of create report user.
   *
   * @param reportUserRepository Report user repository.
   * @param operationService User Service
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REPORT_USER.CREATE)
  async execute(
    @RepositoryParam(ReportUserDatabaseRepository)
    reportUserRepository: ReportUserRepository,
    @KafkaServiceParam(AdminServiceKafka)
    adminService: AdminService,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @LoggerParam(CreateReportUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateReportUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateReportUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    const payload = new CreateReportUserRequest(message);

    logger.info('Create report user.', { payload });

    // Create and call create report operation by gateway controller.
    const controller = new CreateReportUserController(
      logger,
      reportUserRepository,
      adminService,
      operationService,
    );

    const reportUser = await controller.execute(payload);

    logger.info('Report user created.', { reportUser });

    return {
      ctx,
      value: reportUser,
    };
  }
}
