import { Logger } from 'winston';
import { Controller } from '@nestjs/common';

import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
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
  CreateAuthenticatedDebitTransactionController,
  AuthenticatedDebitTransactionRequest,
  AuthenticatedDebitTransactionResponse,
} from '@zro/cielo/interface';

export type CreateAuthenticatedDebitransactionKafkaRequest =
  KafkaMessage<AuthenticatedDebitTransactionRequest>;

export type CreateAuthenticatedDebitransactionKafkaResponse =
  KafkaResponse<AuthenticatedDebitTransactionResponse>;

@Controller()
@MicroserviceController()
export class CreateAuthenticatedDebitTransactionMicroserviceController {
  constructor(private cieloClientService: CieloClientHttpService) {}

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE_AUTHENTICATED_DEBIT)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CreateAuthenticatedDebitTransactionMicroserviceController)
    logger: Logger,
    @Payload('value') request: AuthenticatedDebitTransactionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateAuthenticatedDebitransactionKafkaResponse> {
    logger.debug('Received message.', { value: request });

    const payload = request;

    logger.info('Create Cielo 3DS authenticated debit transaction.', {
      payload,
    });

    const service = new CieloService(this.cieloClientService);

    const controller = new CreateAuthenticatedDebitTransactionController(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
      service,
    );

    // Create payment
    const payment = await controller.execute(payload);

    logger.info('Cielo 3DS authenticated debit transaction created.', {
      payment,
    });

    return {
      ctx,
      value: payment,
    };
  }
}
