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
  ConversionRepository,
  CryptoOrderRepository,
  SystemRepository,
} from '@zro/otc/domain';
import {
  KAFKA_TOPICS,
  ConversionDatabaseRepository,
  CryptoOrderDatabaseRepository,
  UserServiceKafka,
  ConversionEventKafkaEmitter,
  CryptoOrderEventKafkaEmitter,
  OperationServiceKafka,
  QuotationServiceKafka,
  SystemDatabaseRepository,
} from '@zro/otc/infrastructure';
import {
  CreateConversionResponse,
  CreateConversionController,
  CreateConversionRequest,
  ConversionEventEmitterControllerInterface,
  CryptoOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';

export type CreateConversionKafkaRequest =
  KafkaMessage<CreateConversionRequest>;

export type CreateConversionKafkaResponse =
  KafkaResponse<CreateConversionResponse>;

export interface ConversionOperationConfig {
  APP_OPERATION_CONVERSION_TRANSACTION_TAG: string;
  APP_OPERATION_CONVERSION_DEPOSIT_DESCRIPTION: string;
  APP_OPERATION_CONVERSION_WITHDRAWAL_DESCRIPTION: string;
  APP_OPERATION_SYMBOL_CURRENCY_MID_QUOTE: string;
  APP_CONVERSION_ZROBANK_SYSTEM: string;
}

@Controller()
@MicroserviceController()
export class CreateConversionMicroserviceController {
  private readonly conversionOperationTransactionTag: string;
  private readonly conversionDepositOperationDescription: string;
  private readonly conversionWithdrawalOperationDescription: string;
  private readonly symbolCurrencyMidQuote: string;
  private readonly conversionSystemName: string;

  constructor(configService: ConfigService<ConversionOperationConfig>) {
    this.conversionOperationTransactionTag = configService.get<string>(
      'APP_OPERATION_CONVERSION_TRANSACTION_TAG',
    );
    this.conversionDepositOperationDescription = configService.get<string>(
      'APP_OPERATION_CONVERSION_DEPOSIT_DESCRIPTION',
      'Conversion: deposit',
    );
    this.conversionWithdrawalOperationDescription = configService.get<string>(
      'APP_OPERATION_CONVERSION_WITHDRAWAL_DESCRIPTION',
      'Conversion: withdrawal',
    );
    this.symbolCurrencyMidQuote = configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_MID_QUOTE',
    );
    this.conversionSystemName = configService.get<string>(
      'APP_CONVERSION_ZROBANK_SYSTEM',
      'ZROBANK',
    );
  }

  /**
   * Consumer of create conversion.
   * @param {ConversionRepository} conversionRepository Conversion repository.
   * @param {Logger} logger Request logger.
   * @param {CreateConversionKafkaRequest} message Request Kafka message.
   * @returns {CreateConversionKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CONVERSION.CREATE)
  async execute(
    @RepositoryParam(ConversionDatabaseRepository)
    conversionRepository: ConversionRepository,
    @RepositoryParam(CryptoOrderDatabaseRepository)
    cryptoOrderRepository: CryptoOrderRepository,
    @RepositoryParam(SystemDatabaseRepository)
    systemRepository: SystemRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @EventEmitterParam(ConversionEventKafkaEmitter)
    conversionEmitter: ConversionEventEmitterControllerInterface,
    @EventEmitterParam(CryptoOrderEventKafkaEmitter)
    cryptoOrderEmitter: CryptoOrderEventEmitterControllerInterface,
    @LoggerParam(CreateConversionMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateConversionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateConversionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateConversionRequest(message);

    // Create and call conversion controller.
    const controller = new CreateConversionController(
      logger,
      conversionRepository,
      cryptoOrderRepository,
      systemRepository,
      conversionEmitter,
      cryptoOrderEmitter,
      userService,
      operationService,
      quotationService,
      this.conversionOperationTransactionTag,
      this.conversionDepositOperationDescription,
      this.conversionWithdrawalOperationDescription,
      this.conversionSystemName,
      this.symbolCurrencyMidQuote,
    );

    // Call conversion controller
    const conversion = await controller.execute(payload);

    // Create conversion
    logger.info('Conversion created.', { conversion });

    return {
      ctx,
      value: conversion,
    };
  }
}
