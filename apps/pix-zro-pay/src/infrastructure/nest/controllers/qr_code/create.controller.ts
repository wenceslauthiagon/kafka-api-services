import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RedisService,
  RepositoryParam,
} from '@zro/common';
import {
  BankAccountRepository,
  ClientRepository,
  CompanyPolicyRepository,
  CompanyRepository,
  PlanRepository,
} from '@zro/pix-zro-pay/domain';
import { PixPaymentGateway } from '@zro/pix-zro-pay/application';
import {
  BankAccountDatabaseRepository,
  ClientDatabaseRepository,
  CompanyDatabaseRepository,
  CompanyPolicyDatabaseRepository,
  KAFKA_TOPICS,
  LoadGetPaymentGatewayService,
  PlanDatabaseRepository,
  QrCodeEventKafkaEmitter,
  QrCodeRedisRepository,
} from '@zro/pix-zro-pay/infrastructure';
import {
  CreateQrCodeRequest,
  CreateQrCodeResponse,
  CreateQrCodeController,
  QrCodeEventEmitterControllerInterface,
} from '@zro/pix-zro-pay/interface';

export type CreateQrCodeKafkaRequest = KafkaMessage<CreateQrCodeRequest>;

export type CreateQrCodeKafkaResponse = KafkaResponse<CreateQrCodeResponse>;

interface QrCodeConfig {
  APP_QR_CODE_EXPIRATION_IN_SECONDS: number;
  APP_QR_CODE_DEFAULT_TTL_MS: number;
}

/**
 * QrCode controller.
 */
@Controller()
@MicroserviceController()
export class CreateQrCodeMicroserviceController {
  private readonly expirationInSecondsDefault: number;
  private readonly qrCodeRedisRepository: QrCodeRedisRepository;
  private pspGateways: PixPaymentGateway[] = [];

  constructor(
    configService: ConfigService<QrCodeConfig>,
    redisService: RedisService,
    private readonly loadGetPaymentGatewayService: LoadGetPaymentGatewayService,
  ) {
    this.expirationInSecondsDefault = Number(
      configService.get<number>('APP_QR_CODE_EXPIRATION_IN_SECONDS'),
    );
    const qrCodeRedisTtl = Number(
      configService.get<number>('APP_QR_CODE_DEFAULT_TTL_MS'),
    );

    if (!this.expirationInSecondsDefault) {
      throw new MissingEnvVarException(['APP_QR_CODE_EXPIRATION_IN_SECONDS']);
    }

    this.qrCodeRedisRepository = new QrCodeRedisRepository(
      redisService,
      qrCodeRedisTtl,
    );
  }

  async onModuleInit(): Promise<void> {
    const loadPspGateways =
      await this.loadGetPaymentGatewayService.loadServices();

    // Check if none gateway was loaded
    if (!loadPspGateways.length) {
      return;
    }

    this.pspGateways = loadPspGateways.map((service) => service.getGateway());
  }

  /**
   * Consumer of create qrCode code.
   *
   * @param qrCodeRepository QrCode repository.
   * @param eventEmitter QrCode event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE.CREATE)
  async execute(
    @RepositoryParam(BankAccountDatabaseRepository)
    bankAccountRepository: BankAccountRepository,
    @RepositoryParam(ClientDatabaseRepository)
    clientRepository: ClientRepository,
    @RepositoryParam(CompanyDatabaseRepository)
    companyRepository: CompanyRepository,
    @RepositoryParam(CompanyPolicyDatabaseRepository)
    companyPolicyRepository: CompanyPolicyRepository,
    @RepositoryParam(PlanDatabaseRepository)
    planRepository: PlanRepository,
    @EventEmitterParam(QrCodeEventKafkaEmitter)
    qrCodeEmitter: QrCodeEventEmitterControllerInterface,
    @LoggerParam(CreateQrCodeMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateQrCodeRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateQrCodeKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateQrCodeRequest(message);

    logger.info('Create qrCode.', { payload });

    // Create and call create qrCode by user and key controller.
    const controller = new CreateQrCodeController(
      logger,
      bankAccountRepository,
      clientRepository,
      companyRepository,
      companyPolicyRepository,
      planRepository,
      this.qrCodeRedisRepository,
      this.pspGateways,
      qrCodeEmitter,
      this.expirationInSecondsDefault,
    );

    // Create qrCode
    const qrCode = await controller.execute(payload);

    logger.info('QrCode created.', { qrCode });

    return {
      ctx,
      value: qrCode,
    };
  }
}
