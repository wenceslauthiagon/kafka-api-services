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
import { BankingTedRepository, BankTedRepository } from '@zro/banking/domain';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
  BankTedDatabaseRepository,
  BankingTedEventKafkaEmitter,
  UserServiceKafka,
  QuotationServiceKafka,
} from '@zro/banking/infrastructure';
import {
  CreateBankingTedResponse,
  CreateBankingTedController,
  CreateBankingTedRequest,
  BankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

export type CreateBankingTedKafkaRequest =
  KafkaMessage<CreateBankingTedRequest>;

export type CreateBankingTedKafkaResponse =
  KafkaResponse<CreateBankingTedResponse>;

export interface BankingTedOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_BANKING_TED_INTERVAL_HOUR: string;
}

@Controller()
@MicroserviceController()
export class CreateBankingTedMicroserviceController {
  private bankingTedOperationCurrencyTag: string;
  private bankingTedIntervalHour: string;

  constructor(private configService: ConfigService<BankingTedOperationConfig>) {
    this.bankingTedOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.bankingTedIntervalHour = this.configService.get<string>(
      'APP_BANKING_TED_INTERVAL_HOUR',
    );

    if (!this.bankingTedOperationCurrencyTag || !this.bankingTedIntervalHour)
      throw new MissingEnvVarException([
        ...(!this.bankingTedOperationCurrencyTag
          ? ['Operation Currency Tag']
          : []),
        ...(!this.bankingTedIntervalHour ? ['Ted Interval Hour'] : []),
      ]);
  }

  /**
   * Consumer of create bankingTed.
   * @param {BankingTedRepository} bankingTedRepository BankingTed repository.
   * @param {Logger} logger Request logger.
   * @param {CreateBankingTedKafkaRequest} message Request Kafka message.
   * @returns {CreateBankingTedKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED.CREATE)
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @RepositoryParam(BankTedDatabaseRepository)
    bankTedRepository: BankTedRepository,
    @EventEmitterParam(BankingTedEventKafkaEmitter)
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @LoggerParam(CreateBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateBankingTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateBankingTedRequest(message);

    // Create and call bankingTed controller.
    const controller = new CreateBankingTedController(
      logger,
      bankingTedRepository,
      bankTedRepository,
      bankingTedEmitter,
      userService,
      quotationService,
      this.bankingTedOperationCurrencyTag,
      this.bankingTedIntervalHour,
    );

    // Call bankingTed controller
    const bankingTed = await controller.execute(payload);

    // Create bankingTed
    logger.info('BankingTed created.', { bankingTed });

    return {
      ctx,
      value: bankingTed,
    };
  }
}
