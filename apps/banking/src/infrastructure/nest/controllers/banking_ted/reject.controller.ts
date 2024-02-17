import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import {
  BankingTedRepository,
  BankingTedFailureRepository,
} from '@zro/banking/domain';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
  BankingTedEventKafkaEmitter,
  OperationServiceKafka,
  BankingTedFailureDatabaseRepository,
} from '@zro/banking/infrastructure';
import {
  RejectBankingTedResponse,
  RejectBankingTedController,
  RejectBankingTedRequest,
  BankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

export type RejectBankingTedKafkaRequest =
  KafkaMessage<RejectBankingTedRequest>;

export type RejectBankingTedKafkaResponse =
  KafkaResponse<RejectBankingTedResponse>;

export interface RejectBankingTedOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_FAILURE_TED_DESCRIPTION: string;
  APP_OPERATION_FAILURE_TED_TRANSACTION_TAG: string;
}

@Controller()
@MicroserviceController()
export class RejectBankingTedMicroserviceController {
  private bankingTedOperationCurrencyTag: string;
  private bankingTedFailureOperationTransactionTag: string;
  private bankingTedFailureOperationDescription: string;

  constructor(
    private configService: ConfigService<RejectBankingTedOperationConfig>,
  ) {
    this.bankingTedOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.bankingTedFailureOperationDescription = this.configService.get<string>(
      'APP_OPERATION_FAILURE_TED_DESCRIPTION',
    );
    this.bankingTedFailureOperationTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_FAILURE_TED_TRANSACTION_TAG',
      );

    if (
      !this.bankingTedOperationCurrencyTag ||
      !this.bankingTedFailureOperationTransactionTag ||
      !this.bankingTedFailureOperationDescription
    )
      throw new MissingEnvVarException([
        ...(!this.bankingTedOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.bankingTedFailureOperationTransactionTag
          ? ['APP_OPERATION_FAILURE_TED_TRANSACTION_TAG']
          : []),
        ...(!this.bankingTedFailureOperationDescription
          ? ['APP_OPERATION_FAILURE_TED_DESCRIPTION']
          : []),
      ]);
  }

  /**
   * Consumer of create bankingTed.
   * @param {BankingTedRepository} bankingTedRepository BankingTed repository.
   * @param {Logger} logger Request logger.
   * @param {RejectBankingTedKafkaRequest} message Request Kafka message.
   * @returns {RejectBankingTedKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED.REJECT)
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @RepositoryParam(BankingTedFailureDatabaseRepository)
    bankingTedFailureRepository: BankingTedFailureRepository,
    @EventEmitterParam(BankingTedEventKafkaEmitter)
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(RejectBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: RejectBankingTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<RejectBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new RejectBankingTedRequest(message);

    // Reject and call bankingTed controller.
    const controller = new RejectBankingTedController(
      logger,
      bankingTedRepository,
      bankingTedFailureRepository,
      bankingTedEmitter,
      operationService,
      this.bankingTedOperationCurrencyTag,
      this.bankingTedFailureOperationTransactionTag,
      this.bankingTedFailureOperationDescription,
    );

    // Call bankingTed controller
    const bankingTed = await controller.execute(payload);

    // Reject bankingTed
    logger.info('BankingTed completed.', { bankingTed });

    return {
      ctx,
      value: bankingTed,
    };
  }
}
