import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
} from '@zro/common';
import {
  KAFKA_TOPICS,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';
import {
  GetConversionCreditByUserResponse,
  GetConversionCreditByUserController,
  GetConversionCreditByUserRequest,
} from '@zro/otc/interface';

export type GetConversionCreditByUserKafkaRequest =
  KafkaMessage<GetConversionCreditByUserRequest>;

export type GetConversionCreditByUserKafkaResponse =
  KafkaResponse<GetConversionCreditByUserResponse>;

export interface ConversionCreditConfig {
  APP_OPERATION_CONVERSION_TRANSACTION_TAG: string;
  APP_CONVERSION_SYMBOL_CURRENCY_REAL: string;
}

@Controller()
@MicroserviceController()
export class GetConversionCreditByUserMicroserviceController {
  private conversionOperationTransactionTag: string;
  private conversionSymbolCurrencyReal: string;

  constructor(private configService: ConfigService<ConversionCreditConfig>) {
    this.conversionOperationTransactionTag = this.configService.get<string>(
      'APP_OPERATION_CONVERSION_TRANSACTION_TAG',
    );
    this.conversionSymbolCurrencyReal = this.configService.get<string>(
      'APP_CONVERSION_SYMBOL_CURRENCY_REAL',
      'BRL',
    );
  }

  /**
   * Consumer of get by user conversion credit.
   * @returns {GetConversionCreditByUserKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CONVERSION_CREDIT.GET_BY_USER)
  async execute(
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @LoggerParam(GetConversionCreditByUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetConversionCreditByUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetConversionCreditByUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetConversionCreditByUserRequest(message);

    // Get and call conversion credit controller.
    const controller = new GetConversionCreditByUserController(
      logger,
      operationService,
      quotationService,
      this.conversionOperationTransactionTag,
      this.conversionSymbolCurrencyReal,
    );

    // Call conversion credit controller
    const conversionCredit = await controller.execute(payload);

    // Get conversion credit
    logger.info('Conversion credit.', { conversionCredit });

    return {
      ctx,
      value: conversionCredit,
    };
  }
}
