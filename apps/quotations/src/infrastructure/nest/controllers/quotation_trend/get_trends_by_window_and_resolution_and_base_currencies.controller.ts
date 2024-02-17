import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  PrometheusService,
  RepositoryParam,
} from '@zro/common';
import {
  GetTrendsByWindowAndResolutionAndBaseCurrenciesController,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest,
  GetTrendsByWindowAndResolutionAndBaseCurrenciesResponse,
} from '@zro/quotations/interface';
import {
  KAFKA_TOPICS,
  LoadActiveCurrenciesService,
  OperationServiceKafka,
  QuotationTrendPrometheusRepository,
  StreamPairDatabaseRepository,
} from '@zro/quotations/infrastructure';

export type GetTrendsByWindowAndResolutionAndBaseCurrenciesKafkaRequest =
  KafkaMessage<GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest>;

export type GetTrendsByWindowAndResolutionAndBaseCurrenciesKafkaResponse =
  KafkaResponse<GetTrendsByWindowAndResolutionAndBaseCurrenciesResponse>;

export interface GetTrendsByWindowAndResolutionAndBaseCurrenciesConfig {
  APP_OPERATION_CURRENCY_SYMBOL: string;
}

/**
 * Get trends controller.
 */
@Controller()
@MicroserviceController()
export class GetTrendsByWindowAndResolutionAndBaseCurrenciesMicroserviceController {
  private readonly operationCurrencySymbol: string;
  private readonly quotationTrendRepository: QuotationTrendPrometheusRepository;

  constructor(
    private readonly configService: ConfigService<GetTrendsByWindowAndResolutionAndBaseCurrenciesConfig>,
    private readonly prometheusService: PrometheusService,
    private readonly loadActiveCurrenciesService: LoadActiveCurrenciesService,
  ) {
    this.operationCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_SYMBOL',
    );

    if (!this.operationCurrencySymbol) {
      throw new MissingEnvVarException(['APP_OPERATION_CURRENCY_SYMBOL']);
    }

    this.quotationTrendRepository = new QuotationTrendPrometheusRepository(
      this.prometheusService,
    );
  }

  /**
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.QUOTATION_TREND
      .GET_TRENDS_BY_WINDOW_AND_RESOLUTION_AND_BASE_CURRENCIES,
  )
  async execute(
    @RepositoryParam(StreamPairDatabaseRepository)
    streamPairRepository: StreamPairDatabaseRepository,
    @LoggerParam(
      GetTrendsByWindowAndResolutionAndBaseCurrenciesMicroserviceController,
    )
    logger: Logger,
    @Payload('value')
    message: GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetTrendsByWindowAndResolutionAndBaseCurrenciesKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetTrendsByWindowAndResolutionAndBaseCurrenciesRequest(
      message,
    );

    logger.info('Get trends payload.', { payload });

    const operationService = new OperationServiceKafka(
      logger,
      this.loadActiveCurrenciesService,
    );

    // Get trends controller.
    const controller =
      new GetTrendsByWindowAndResolutionAndBaseCurrenciesController(
        logger,
        this.quotationTrendRepository,
        streamPairRepository,
        operationService,
        this.operationCurrencySymbol,
      );

    const result = await controller.execute(payload);

    logger.info('Got trends result.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
