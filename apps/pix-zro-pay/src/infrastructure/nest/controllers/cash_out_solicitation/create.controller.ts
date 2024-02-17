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
  BankAccountRepository,
  CashOutSolicitationRepository,
  CompanyRepository,
  UserRepository,
} from '@zro/pix-zro-pay/domain';
import {
  BankAccountDatabaseRepository,
  CashOutSolicitationDatabaseRepository,
  CompanyDatabaseRepository,
  KAFKA_TOPICS,
  UserDatabaseRepository,
} from '@zro/pix-zro-pay/infrastructure';
import {
  CreateCashOutSolicitationRequest,
  CreateCashOutSolicitationResponse,
  CreateCashOutSolicitationController,
} from '@zro/pix-zro-pay/interface';

export type CreateCashOutSolicitationKafkaRequest =
  KafkaMessage<CreateCashOutSolicitationRequest>;

export type CreateCashOutSolicitationKafkaResponse =
  KafkaResponse<CreateCashOutSolicitationResponse>;

/**
 * CreateCashOutSolicitation controller.
 */
@Controller()
@MicroserviceController()
export class CreateCashOutSolicitationMicroserviceController {
  /**
   * @param cashOutSolicitationRepository CashOutSolicitation repository.
   * @param companyRepository CompanyRepository repository.
   * @param bankAccountRepository BankAccountRepository repository.
   * @param userRepository UserRepository repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CASHOUT_SOLICITATION.CREATE)
  async execute(
    @RepositoryParam(CashOutSolicitationDatabaseRepository)
    cashOutSolicitationRepository: CashOutSolicitationRepository,
    @RepositoryParam(CompanyDatabaseRepository)
    companyRepository: CompanyRepository,
    @RepositoryParam(BankAccountDatabaseRepository)
    bankAccountRepository: BankAccountRepository,
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(CreateCashOutSolicitationMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateCashOutSolicitationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateCashOutSolicitationKafkaResponse> {
    logger.debug('Received message.', { message });

    logger.info('Create cash out solicitation.');

    const payload = new CreateCashOutSolicitationRequest(message);

    const controller = new CreateCashOutSolicitationController(
      logger,
      cashOutSolicitationRepository,
      companyRepository,
      bankAccountRepository,
      userRepository,
    );

    const cashOutSolicitation = await controller.execute(payload);

    logger.info('Cash out solicitation found.', { cashOutSolicitation });

    return {
      ctx,
      value: cashOutSolicitation,
    };
  }
}
