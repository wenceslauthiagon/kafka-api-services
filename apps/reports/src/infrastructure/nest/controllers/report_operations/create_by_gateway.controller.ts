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
import { ReportOperationRepository } from '@zro/reports/domain';
import {
  KAFKA_TOPICS,
  ReportOperationDatabaseRepository,
  OperationServiceKafka,
  UserServiceKafka,
} from '@zro/reports/infrastructure';
import {
  CreateReportOperationByGatewayRequest,
  CreateReportOperationByGatewayResponse,
  CreateReportOperationByGatewayController,
} from '@zro/reports/interface';

export type CreateReportOperationByGatewayKafkaRequest =
  KafkaMessage<CreateReportOperationByGatewayRequest>;

export type CreateReportOperationByGatewayKafkaResponse =
  KafkaResponse<CreateReportOperationByGatewayResponse>;

/**
 * Reports controller.
 */
@Controller()
@MicroserviceController()
export class CreateReportOperationByGatewayMicroserviceController {
  /**
   * Consumer of create report operation by gateway.
   *
   * @param reportOperationRepository ReportOperation repository.
   * @param operationService Operation Service
   * @param userService User Service
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REPORT_OPERATION.CREATE_BY_GATEWAY)
  async execute(
    @RepositoryParam(ReportOperationDatabaseRepository)
    reportOperationRepository: ReportOperationRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(CreateReportOperationByGatewayMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateReportOperationByGatewayRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateReportOperationByGatewayKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateReportOperationByGatewayRequest(message);

    logger.info('Create report operation by gateway.', { payload });

    // Create and call create report operation by gateway controller.
    const controller = new CreateReportOperationByGatewayController(
      logger,
      reportOperationRepository,
      operationService,
      userService,
    );

    // Create reportOperation
    const reportOperation = await controller.execute(payload);

    logger.info('Report operation created.', { reportOperation });

    return {
      ctx,
      value: reportOperation,
    };
  }
}
