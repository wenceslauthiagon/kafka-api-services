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
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { BotOtcOrderRepository, BotOtcRepository } from '@zro/otc-bot/domain';
import {
  BotOtcDatabaseRepository,
  BotOtcOrderDatabaseRepository,
  KAFKA_TOPICS,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc-bot/infrastructure';
import {
  GetBotOtcAnalysisResponse,
  GetBotOtcAnalysisController,
  GetBotOtcAnalysisRequest,
} from '@zro/otc-bot/interface';

interface GetBotOtcAnalysisConfig {
  APP_OTC_REMITTANCE_CURRENCY_TAG: string;
  APP_OTC_REMITTANCE_CURRENCY_DECIMAL: string;
  APP_OTC_IOF_NAME: string;
}

export type GetBotOtcAnalysisKafkaRequest =
  KafkaMessage<GetBotOtcAnalysisRequest>;

export type GetBotOtcAnalysisKafkaResponse =
  KafkaResponse<GetBotOtcAnalysisResponse>;

@Controller()
@MicroserviceController()
export class GetBotOtcAnalysisMicroserviceController {
  private readonly iofName: string;
  private readonly remittanceCurrencyTag: Currency['tag'];
  private readonly remittanceCurrencyDecimal: Currency['decimal'];

  constructor(configService: ConfigService<GetBotOtcAnalysisConfig>) {
    this.remittanceCurrencyTag = configService.get<string>(
      'APP_OTC_REMITTANCE_CURRENCY_TAG',
    );

    const remittanceCurrencyDecimalString = configService.get<string>(
      'APP_OTC_REMITTANCE_CURRENCY_DECIMAL',
    );

    this.iofName = configService.get<string>('APP_OTC_IOF_NAME');

    if (
      !this.remittanceCurrencyTag ||
      !remittanceCurrencyDecimalString ||
      !this.iofName
    ) {
      throw new MissingEnvVarException([
        ...(!this.remittanceCurrencyTag
          ? ['APP_OTC_REMITTANCE_CURRENCY_TAG']
          : []),
        ...(!remittanceCurrencyDecimalString
          ? ['APP_OTC_REMITTANCE_CURRENCY_DECIMAL']
          : []),
        ...(!this.iofName ? ['APP_OTC_IOF_NAME'] : []),
      ]);
    }

    this.remittanceCurrencyDecimal = parseInt(remittanceCurrencyDecimalString);
  }

  /**
   * Consumer of get bot otc analysis.
   * @param botOtcRepository Bot Otc repository.
   * @param botOtcOrderRepository Bot Otc Order repository.
   * @param operationService Operation service.
   * @param quotationService Quotation service.
   * @param logger Request logger.
   * @param message Request message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BOT_OTC.GET_ANALYSIS)
  async execute(
    @RepositoryParam(BotOtcDatabaseRepository)
    botOtcRepository: BotOtcRepository,
    @RepositoryParam(BotOtcOrderDatabaseRepository)
    botOtcOrderRepository: BotOtcOrderRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @LoggerParam(GetBotOtcAnalysisMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBotOtcAnalysisRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBotOtcAnalysisKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBotOtcAnalysisRequest(message);

    // Instantiate get bot otc analysis controller.
    const controller = new GetBotOtcAnalysisController(
      logger,
      botOtcRepository,
      botOtcOrderRepository,
      operationService,
      quotationService,
      this.remittanceCurrencyTag,
      this.remittanceCurrencyDecimal,
      this.iofName,
    );

    // Call get bot otc analysis controller.
    const botAnalysis = await controller.execute(payload);

    logger.info('Bot otc analysis found.', { botAnalysis });

    return {
      ctx,
      value: botAnalysis,
    };
  }
}
