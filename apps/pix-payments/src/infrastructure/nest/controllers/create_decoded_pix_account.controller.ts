import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import { TopazioKycGatewayParam, TopazioKycInterceptor } from '@zro/topazio';
import { DecodedPixAccountRepository } from '@zro/pix-payments/domain';
import { KycGateway, UserService } from '@zro/pix-payments/application';
import {
  KAFKA_TOPICS,
  UserServiceKafka,
  DecodedPixAccountDatabaseRepository,
  DecodedPixAccountEventKafkaEmitter,
  BankingServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateDecodedPixAccountController,
  CreateDecodedPixAccountRequest,
  CreateDecodedPixAccountResponse,
  DecodedPixAccountEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreateDecodedPixAccountKafkaRequest =
  KafkaMessage<CreateDecodedPixAccountRequest>;

export type CreateDecodedPixAccountKafkaResponse =
  KafkaResponse<CreateDecodedPixAccountResponse>;

interface CreateDecodedPixAccountConfig {
  APP_PIX_DECODED_ACCOUNT_MAX_NUMBER_PENDING_PER_DAY: number;
  APP_ZROBANK_ISPB: string;
}

/**
 * CreateDecodedPixAccount controller.
 */
@Controller()
@MicroserviceController([TopazioKycInterceptor])
export class CreateDecodedPixAccountMicroserviceController {
  private pixDecodedAccountMaxNumberPendingPerDay: number;
  private pixPaymentZroBankIspb: string;

  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<CreateDecodedPixAccountConfig>,
  ) {
    this.pixDecodedAccountMaxNumberPendingPerDay =
      this.configService.get<number>(
        'APP_PIX_DECODED_ACCOUNT_MAX_NUMBER_PENDING_PER_DAY',
        20,
      );

    this.pixPaymentZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');

    if (
      !this.pixDecodedAccountMaxNumberPendingPerDay ||
      !this.pixPaymentZroBankIspb
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixDecodedAccountMaxNumberPendingPerDay
          ? ['APP_PIX_DECODED_ACCOUNT_MAX_NUMBER_PENDING_PER_DAY']
          : []),
        ...(!this.pixPaymentZroBankIspb ? ['APP_ZROBANK_ISPB'] : []),
      ]);
    }
  }

  /**
   * Consumer of pix decoded account.
   *
   * @param pixDecodedAccountRepository DecodedAccount repository.
   * @param pixDecodedAccountEventEmitter DecodedAccount event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DECODED_PIX_ACCOUNT.CREATE)
  async execute(
    @RepositoryParam(DecodedPixAccountDatabaseRepository)
    pixDecodedAccountRepository: DecodedPixAccountRepository,
    @EventEmitterParam(DecodedPixAccountEventKafkaEmitter)
    pixDecodedAccountEventEmitter: DecodedPixAccountEventEmitterControllerInterface,
    @LoggerParam(CreateDecodedPixAccountMicroserviceController)
    logger: Logger,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @TopazioKycGatewayParam()
    kycGateway: KycGateway,
    @Payload('value') message: CreateDecodedPixAccountRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateDecodedPixAccountKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateDecodedPixAccountRequest(message);

    logger.info('Create pix decoded account to user.', { payload });

    // Create and call decode account by user and key controller.
    const controller = new CreateDecodedPixAccountController(
      logger,
      pixDecodedAccountRepository,
      pixDecodedAccountEventEmitter,
      bankingService,
      userService,
      this.pixDecodedAccountMaxNumberPendingPerDay,
      kycGateway,
      this.pixPaymentZroBankIspb,
    );

    // Create a DecodedPixAccount
    const pixDecodedAccount = await controller.execute(payload);

    logger.info('Created pix decoded account.', { pixDecodedAccount });

    return {
      ctx,
      value: pixDecodedAccount,
    };
  }
}
