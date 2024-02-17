import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  RepositoryParam,
  LoggerParam,
  MicroserviceController,
  KafkaResponse,
  KafkaMessage,
  KafkaMessagePattern,
  MissingEnvVarException,
} from '@zro/common';
import {
  CreatePaymentController,
  CreatePaymentRequest,
  CreatePaymentResponse,
} from '@zro/picpay/interface';
import {
  CheckoutDatabaseRepository,
  CheckoutHistoricDatabaseRepository,
  KAFKA_TOPICS,
  PaymentsService,
  PicpayClientService,
} from '@zro/picpay/infrastructure';

export type CreatePaymentKafkaRequest = KafkaMessage<CreatePaymentRequest>;

export type CreatePaymentKafkaResponse = KafkaResponse<CreatePaymentResponse>;

interface CreatePicPayPaymentConfig {
  APP_PICPAY_CHANNEL: string;
  APP_PICPAY_PURCHASE_MODE: string;
  APP_PICPAY_SOFT_DESCRIPTOR: string;
}

@Controller()
@MicroserviceController()
export class CreatePaymentMicroserviceController {
  private readonly picpayChannel: string;
  private readonly picpayPurchaseMode: string;
  private readonly picpaySoftDescriptor: string;

  constructor(
    private readonly picpayClientService: PicpayClientService,
    configService: ConfigService<CreatePicPayPaymentConfig>,
  ) {
    this.picpayChannel = configService.get<string>('APP_PICPAY_CHANNEL');
    this.picpayPurchaseMode = configService.get<string>(
      'APP_PICPAY_PURCHASE_MODE',
    );
    this.picpaySoftDescriptor = configService.get<string>(
      'APP_PICPAY_SOFT_DESCRIPTOR',
    );

    if (
      !this.picpayChannel ||
      !this.picpayPurchaseMode ||
      !this.picpaySoftDescriptor
    ) {
      throw new MissingEnvVarException([
        ...(!this.picpayChannel ? ['APP_PICPAY_CHANNEL'] : []),
        ...(!this.picpayPurchaseMode ? ['APP_PICPAY_PURCHASE_MODE'] : []),
        ...(!this.picpaySoftDescriptor ? ['APP_PICPAY_SOFT_DESCRIPTOR'] : []),
      ]);
    }
  }

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE)
  async execute(
    @RepositoryParam(CheckoutDatabaseRepository)
    checkoutRepository: CheckoutDatabaseRepository,
    @RepositoryParam(CheckoutHistoricDatabaseRepository)
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    @LoggerParam(CreatePaymentMicroserviceController)
    logger: Logger,
    @Payload('value') request: CreatePaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreatePaymentKafkaResponse> {
    logger.debug('Received message.', { value: request });

    // Parse kafka message.
    const payload = request;

    logger.info('Create PicPay payment.', { payload });

    const service = new PaymentsService(this.picpayClientService);

    const controller = new CreatePaymentController(
      logger,
      service,
      checkoutRepository,
      checkoutHistoricRepository,
      this.picpayChannel,
      this.picpayPurchaseMode,
      this.picpaySoftDescriptor,
    );

    // Create payment
    const payment = await controller.execute(payload.checkoutId);

    logger.info('Payment created.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
