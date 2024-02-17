import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  CieloClientHttpService,
  CieloService,
  KAFKA_TOPICS,
} from '@zro/cielo/infrastructure';
import {
  CreateNonAuthenticatedDebitTransactionController,
  NonAuthenticatedDebitTransactionRequest,
  NonAuthenticatedDebitTransactionResponse,
} from '@zro/cielo/interface';

export type CreateNonAuthenticatedDebitTransactionKafkaRequest =
  KafkaMessage<NonAuthenticatedDebitTransactionRequest>;

export type CreateNonAuthenticatedDebitTransactionKafkaResponse =
  KafkaResponse<NonAuthenticatedDebitTransactionResponse>;

interface CreateCieloDebitPaymentConfig {
  APP_CIELO_CREDENTIALS_CODE: string;
  APP_CIELO_CREDENTIALS_KEY: string;
  APP_CIELO_CREDENTIALS_USERNAME: string;
  APP_CIELO_CREDENTIALS_PASSWORD: string;
}

@Controller()
@MicroserviceController()
export class CreateNonAuthenticatedDebitTransactionMicroserviceController {
  private appCieloCredentialsCode: string;
  private appCieloCredentialsKey: string;
  private appCieloCredentialsUsername: string;
  private appCieloCredentialsPassword: string;

  constructor(
    private cieloClientService: CieloClientHttpService,
    private configService: ConfigService<CreateCieloDebitPaymentConfig>,
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

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE_NON_AUTHENTICATED_DEBIT)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CreateNonAuthenticatedDebitTransactionMicroserviceController)
    logger: Logger,
    @Payload('value') request: NonAuthenticatedDebitTransactionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateNonAuthenticatedDebitTransactionKafkaResponse> {
    logger.debug('Received message.', { value: request });

    const payload = request;

    logger.info('Create Cielo non authenticated debit transaction.', {
      payload,
    });

    const service = new CieloService(this.cieloClientService);

    const controller = new CreateNonAuthenticatedDebitTransactionController(
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

    logger.info('Created debit transaction.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
