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
  RepositoryParam,
} from '@zro/common';
import {
  CashbackRepository,
  ConversionRepository,
  CryptoOrderRepository,
  SystemRepository,
} from '@zro/otc/domain';
import {
  KAFKA_TOPICS,
  CashbackDatabaseRepository,
  CryptoOrderDatabaseRepository,
  UserServiceKafka,
  CashbackEventKafkaEmitter,
  CryptoOrderEventKafkaEmitter,
  OperationServiceKafka,
  QuotationServiceKafka,
  SystemDatabaseRepository,
  ConversionDatabaseRepository,
  ConversionEventKafkaEmitter,
} from '@zro/otc/infrastructure';
import {
  CreateCashbackResponse,
  CreateCashbackController,
  CreateCashbackRequest,
  CashbackEventEmitterControllerInterface,
  CryptoOrderEventEmitterControllerInterface,
  ConversionEventEmitterControllerInterface,
} from '@zro/otc/interface';

export type CreateCashbackKafkaRequest = KafkaMessage<CreateCashbackRequest>;

export type CreateCashbackKafkaResponse = KafkaResponse<CreateCashbackResponse>;

export interface CashbackOperationConfig {
  APP_OPERATION_CASHBACK_TRANSACTION_TAG: string;
  APP_OPERATION_SYMBOL_CURRENCY_MID_QUOTE: string;
  APP_CONVERSION_ZROBANK_SYSTEM: string;
}

@Controller()
@MicroserviceController()
export class CreateCashbackMicroserviceController {
  private cashbackOperationTransactionTag: string;
  private symbolCurrencyMidQuote: string;
  private conversionSystemName: string;

  constructor(private configService: ConfigService<CashbackOperationConfig>) {
    this.cashbackOperationTransactionTag = this.configService.get<string>(
      'APP_OPERATION_CASHBACK_TRANSACTION_TAG',
    );
    this.symbolCurrencyMidQuote = this.configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_MID_QUOTE',
    );
    this.conversionSystemName = this.configService.get<string>(
      'APP_CONVERSION_ZROBANK_SYSTEM',
      'ZROBANK',
    );
  }

  /**
   * Consumer of create cashback.
   * @param {CashbackRepository} cashbackRepository Cashback repository.
   * @param {Logger} logger Request logger.
   * @param {CreateCashbackKafkaRequest} message Request Kafka message.
   * @returns {CreateCashbackKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CASHBACK.CREATE)
  async execute(
    @RepositoryParam(ConversionDatabaseRepository)
    conversionRepository: ConversionRepository,
    @RepositoryParam(CryptoOrderDatabaseRepository)
    cryptoOrderRepository: CryptoOrderRepository,
    @RepositoryParam(SystemDatabaseRepository)
    systemRepository: SystemRepository,
    @RepositoryParam(CashbackDatabaseRepository)
    cashbackRepository: CashbackRepository,
    @EventEmitterParam(CryptoOrderEventKafkaEmitter)
    cryptoOrderEmitter: CryptoOrderEventEmitterControllerInterface,
    @EventEmitterParam(ConversionEventKafkaEmitter)
    conversionEmitter: ConversionEventEmitterControllerInterface,
    @EventEmitterParam(CashbackEventKafkaEmitter)
    cashbackEmitter: CashbackEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(CreateCashbackMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateCashbackRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateCashbackKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateCashbackRequest(message);

    // Create and call cashback controller.
    const controller = new CreateCashbackController(
      logger,
      conversionRepository,
      cryptoOrderRepository,
      systemRepository,
      cashbackRepository,
      cryptoOrderEmitter,
      conversionEmitter,
      cashbackEmitter,
      operationService,
      quotationService,
      userService,
      this.cashbackOperationTransactionTag,
      this.conversionSystemName,
      this.symbolCurrencyMidQuote,
    );

    // Call cashback controller
    const cashback = await controller.execute(payload);

    // Create cashback
    logger.info('Cashback created.', { cashback });

    return {
      ctx,
      value: cashback,
    };
  }
}
