import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
  RestServiceParam,
} from '@zro/common';
import { CryptoReportRepository } from '@zro/otc/domain';
import {
  HistoricalCryptoPriceGateway,
  StorageService,
} from '@zro/otc/application';
import {
  KAFKA_TOPICS,
  StorageServiceRest,
  UserServiceKafka,
  OperationServiceKafka,
  QuotationServiceKafka,
  CryptoReportDatabaseRepository,
} from '@zro/otc/infrastructure';
import {
  GetCryptoReportByCurrencyAndFormatController,
  GetCryptoReportByCurrencyAndFormatRequest,
  GetCryptoReportByCurrencyAndFormatResponse,
} from '@zro/otc/interface';
import {
  MercadoBitcoinHistoricalCryptoPriceInterceptor,
  MercadoBitcoinHistoricalCryptoPriceParam,
} from '@zro/mercado-bitcoin/infrastructure';

export type GetCryptoReportByCurrencyAndFormatKafkaRequest =
  KafkaMessage<GetCryptoReportByCurrencyAndFormatRequest>;

export type GetCryptoReportByCurrencyAndFormatKafkaResponse =
  KafkaResponse<GetCryptoReportByCurrencyAndFormatResponse>;

interface CryptoReportConfig {
  APP_STORAGE_BASE_URL: string;
  APP_ZROBANK_LOGO_URL: string;
}

@Controller()
@MicroserviceController([MercadoBitcoinHistoricalCryptoPriceInterceptor])
export class GetCryptoReportByCurrencyAndFormatMicroserviceController {
  private axiosInstance: AxiosInstance;
  private readonly zrobankLogoUrl: string;

  /**
   * Default generate crypto report by currency and format worksheet RPC controller constructor.
   */
  constructor(private configService: ConfigService<CryptoReportConfig>) {
    const baseURL = this.configService.get<string>('APP_STORAGE_BASE_URL');

    this.zrobankLogoUrl = this.configService.get<string>(
      'APP_ZROBANK_LOGO_URL',
    );

    if (!baseURL || !this.zrobankLogoUrl) {
      throw new MissingEnvVarException([
        ...(!baseURL ? ['APP_STORAGE_BASE_URL'] : []),
        ...(!this.zrobankLogoUrl ? ['APP_ZROBANK_LOGO_URL'] : []),
      ]);
    }

    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * Consumer of get crypto report by currency symbol and format controller.
   *
   * @param logger Request logger.
   * @param message Request message.
   * @param storageService Storage Service instance which calls gateway.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CRYPTO_REPORT.GET_BY_CURRENCY_AND_FORMAT)
  async execute(
    @LoggerParam(GetCryptoReportByCurrencyAndFormatMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetCryptoReportByCurrencyAndFormatRequest,
    @RestServiceParam(StorageServiceRest)
    storageService: StorageService,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @RepositoryParam(CryptoReportDatabaseRepository)
    cryptoReportRepository: CryptoReportRepository,
    @MercadoBitcoinHistoricalCryptoPriceParam()
    historicalCryptoPriceGateway: HistoricalCryptoPriceGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCryptoReportByCurrencyAndFormatKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCryptoReportByCurrencyAndFormatRequest(message);

    logger.debug('Get crypto report by currency symbol and format.', {
      payload,
    });

    // Create get controller.
    const controller = new GetCryptoReportByCurrencyAndFormatController(
      logger,
      storageService,
      this.axiosInstance,
      userService,
      operationService,
      quotationService,
      cryptoReportRepository,
      historicalCryptoPriceGateway,
      this.zrobankLogoUrl,
    );

    // Get wallet invitation.
    const cryptoReport = await controller.execute(payload);

    logger.debug('Crypto report found.', { cryptoReport });

    return {
      ctx,
      value: cryptoReport,
    };
  }
}
