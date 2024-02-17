import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { KafkaContext, Ctx, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  CashOutSolicitationRepository,
  CompanyRepository,
} from '@zro/pix-zro-pay/domain';
import {
  CashOutSolicitationDatabaseRepository,
  CompanyDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/pix-zro-pay/infrastructure';
import {
  GetAllCashOutSolicitationController,
  GetAllCashOutSolicitationResponse,
  GetAllCashOutSolicitationRequest,
} from '@zro/pix-zro-pay/interface';

export type GetAllCashOutSolicitationKafkaRequest =
  KafkaMessage<GetAllCashOutSolicitationRequest>;

export type GetAllCashOutSolicitationKafkaResponse =
  KafkaResponse<GetAllCashOutSolicitationResponse>;

/**
 * GetAllCashOutSolicitation controller.
 */
@Controller()
@MicroserviceController()
export class GetAllCashOutSolicitationMicroserviceController {
  /**
   * @param cashOutSolicitationRepository CashOutSolicitationRepository repository.
   * @param companyRepository Company repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CASHOUT_SOLICITATION.GET_ALL)
  async execute(
    @RepositoryParam(CashOutSolicitationDatabaseRepository)
    cashOutSolicitationRepository: CashOutSolicitationRepository,
    @RepositoryParam(CompanyDatabaseRepository)
    companyRepository: CompanyRepository,
    @LoggerParam(GetAllCashOutSolicitationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllCashOutSolicitationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllCashOutSolicitationKafkaResponse> {
    logger.debug('Received message.', { message });

    // Parse kafka message.

    const payload = new GetAllCashOutSolicitationRequest(message);

    // Create and call get request for cash out solicitation controller.
    const controller = new GetAllCashOutSolicitationController(
      logger,
      cashOutSolicitationRepository,
      companyRepository,
    );

    // Get all cashOutSolicitation
    const cashOutSolicitations = await controller.execute(payload);

    logger.info('Cash out solicitations found.', {
      cashOutSolicitations,
    });

    return {
      ctx,
      value: cashOutSolicitations,
    };
  }
}
