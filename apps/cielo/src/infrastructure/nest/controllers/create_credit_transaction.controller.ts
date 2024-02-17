import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import {
  CreditTransactionController,
  CreditTransactionRequest,
  CreditTransactionResponse,
} from '@zro/cielo/interface';
import {
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  CieloClientHttpService,
  CieloService,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import { ConfigService } from '@nestjs/config';

export type CreateCreditTransactionKafkaRequest =
  KafkaMessage<CreditTransactionRequest>;

export type CreateCreditTransactionKafkaResponse =
  KafkaResponse<CreditTransactionResponse>;

interface CreateCieloCreditPaymentConfig {
  APP_CIELO_CREDENTIALS_CODE: string;
  APP_CIELO_CREDENTIALS_KEY: string;
  APP_CIELO_CREDENTIALS_USERNAME: string;
  APP_CIELO_CREDENTIALS_PASSWORD: string;
}

@Controller()
@MicroserviceController()
export class CreateCreditTransactionMicroserviceController {
  private appCieloCredentialsCode: string;
  private appCieloCredentialsKey: string;
  private appCieloCredentialsUsername: string;
  private appCieloCredentialsPassword: string;

  constructor(
    private cieloClientService: CieloClientHttpService,
    private configService: ConfigService<CreateCieloCreditPaymentConfig>,
  ) {
    this.appCieloCredentialsCode = this.configService.get<string>(
      'APP_CIELO_CREDENTIALS_CODE',
    );
    this.appCieloCredentialsKey = this.configService.get<string>(
      'APP_CIELO_CREDENTIALS_KEY',
    );
    this.appCieloCredentialsUsername = this.configService.get<string>(
      'APP_CIELO_CREDENTIALS_USERNAME',
    );
    this.appCieloCredentialsPassword = this.configService.get<string>(
      'APP_CIELO_CREDENTIALS_PASSWORD',
    );

    if (
      !this.appCieloCredentialsCode ||
      !this.appCieloCredentialsKey ||
      !this.appCieloCredentialsUsername ||
      !this.appCieloCredentialsPassword
    ) {
      throw new MissingEnvVarException([
        ...(!this.appCieloCredentialsCode
          ? ['APP_CIELO_CREDENTIALS_CODE']
          : []),
        ...(!this.appCieloCredentialsKey ? ['APP_CIELO_CREDENTIALS_KEY'] : []),
        ...(!this.appCieloCredentialsUsername
          ? ['APP_CIELO_CREDENTIALS_USERNAME']
          : []),
        ...(!this.appCieloCredentialsPassword
          ? ['APP_CIELO_CREDENTIALS_PASSWORD']
          : []),
      ]);
    }
  }

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE_CREDIT)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CreateCreditTransactionMicroserviceController)
    logger: Logger,
    @Payload('value') request: CreditTransactionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateCreditTransactionKafkaResponse> {
    logger.debug('Received message.', { value: request });

    const payload = request;

    logger.info('Create Cielo credit transaction.', { payload });

    const service = new CieloService(this.cieloClientService);

    const controller = new CreditTransactionController(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
      service,
      this.appCieloCredentialsCode,
      this.appCieloCredentialsKey,
      this.appCieloCredentialsUsername,
      this.appCieloCredentialsPassword,
    );

    // Create payment
    const payment = await controller.execute(payload);

    logger.info('Cielo credit transaction created.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
