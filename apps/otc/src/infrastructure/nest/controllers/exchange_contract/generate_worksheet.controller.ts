import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  RestServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import { ExchangeContractRepository } from '@zro/otc/domain';
import { StorageService } from '@zro/otc/application';
import {
  GenerateExchangeContractWorksheetResponse,
  GenerateExchangeContractWorksheetController,
  GenerateExchangeContractWorksheetRequest,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ExchangeContractDatabaseRepository,
  StorageServiceRest,
} from '@zro/otc/infrastructure';

export type GenerateExchangeContractWorksheetKafkaRequest =
  KafkaMessage<GenerateExchangeContractWorksheetRequest>;

export type GenerateExchangeContractWorksheetKafkaResponse =
  KafkaResponse<GenerateExchangeContractWorksheetResponse>;

/**
 * Exchange Contract controller.
 */
interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
}

@Controller()
@MicroserviceController()
export class GenerateExchangeContractWorksheetMicroserviceController {
  private readonly axiosInstance: AxiosInstance;

  /**
   * Default Generate Exchange Contract worksheet RPC controller constructor.
   */
  constructor(private configService: ConfigService<StorageConfig>) {
    const baseURL = this.configService.get<string>('APP_STORAGE_BASE_URL');
    if (!baseURL) {
      throw new MissingEnvVarException('APP_STORAGE_BASE_URL');
    }
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * Consumer of generate ExchangeContracts worksheet.
   * @param {ExchangeContractRepository} exchangeContractRepository ExchangeContract repository.
   * @param {Logger} logger Request logger.
   * @param {StorageService} storageService Storage Service instance which calls gateway.
   * @param {GenerateExchangeContractWorksheetKafkaRequest} message Request Kafka message.
   * @returns {GenerateExchangeContractWorksheetKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.EXCHANGE_CONTRACT.GENERATE_WORKSHEET)
  async execute(
    @RepositoryParam(ExchangeContractDatabaseRepository)
    exchangeContractRepository: ExchangeContractRepository,
    @LoggerParam(GenerateExchangeContractWorksheetMicroserviceController)
    logger: Logger,
    @RestServiceParam(StorageServiceRest)
    storageService: StorageService,
    @Payload('value') message: GenerateExchangeContractWorksheetRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GenerateExchangeContractWorksheetKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GenerateExchangeContractWorksheetRequest(message);

    // Create and call generate ExchangeContracts worksheet controller.
    const controller = new GenerateExchangeContractWorksheetController(
      logger,
      exchangeContractRepository,
      storageService,
      this.axiosInstance,
    );

    // Call generate exchange contracts controller
    const fileWorksheet = await controller.execute(payload);

    // Generate file worksheet
    logger.info('Exchange Contracts Worksheet created.', { fileWorksheet });

    return {
      ctx,
      value: fileWorksheet,
    };
  }
}
