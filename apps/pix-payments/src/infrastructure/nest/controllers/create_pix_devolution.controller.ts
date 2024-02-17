import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixDepositDatabaseRepository,
  PixDevolutionDatabaseRepository,
  PixDevolutionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  CreatePixDevolutionRequest,
  CreatePixDevolutionResponse,
  CreatePixDevolutionController,
  PixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreatePixDevolutionKafkaRequest =
  KafkaMessage<CreatePixDevolutionRequest>;

export type CreatePixDevolutionKafkaResponse =
  KafkaResponse<CreatePixDevolutionResponse>;

interface PaymentDevolutionConfig {
  APP_PIX_DEVOLUTION_MAX_NUMBER: string;
  APP_PIX_DEPOSIT_DEVOLUTION_INTERVAL_DAYS: string;
  APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG: string;
  APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG: string;
  APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG: string;
}

/**
 * Devolution controller.
 */
@Controller()
@MicroserviceController()
export class CreatePixDevolutionMicroserviceController {
  /**
   * The default number is 0, so there's no limit to create devolution
   */
  private readonly DEVOLUTION_MAX_NUMBER_DEFAULT: string = '0';

  /**
   * The maximum number of devolutions for a deposit.
   * If flag is 0, there's no limit to create devolution
   */
  private readonly pixPaymentDevolutionMaxNumber: number;

  /**
   * The interval of days that a devolution can be requested.
   */
  private pixDepositDevolutionIntervalDays: number;

  /**
   * Static withdrawal transaction tag.
   */
  private staticWithdrawalTransactionTag: string;

  /**
   * Dinamic withdrawal transaction tag.
   */
  private dinamicWithdrawalTransactionTag: string;

  /**
   * Dinamic change transaction tag.
   */
  private dinamicChangeTransactionTag: string;

  /**
   * Default devolution RPC controller constructor.
   */
  constructor(private configService: ConfigService<PaymentDevolutionConfig>) {
    this.pixPaymentDevolutionMaxNumber = parseInt(
      this.configService.get<string>('APP_PIX_DEVOLUTION_MAX_NUMBER') ||
        this.DEVOLUTION_MAX_NUMBER_DEFAULT,
    );

    this.pixDepositDevolutionIntervalDays = this.configService.get<number>(
      'APP_PIX_DEPOSIT_DEVOLUTION_INTERVAL_DAYS',
    );

    this.staticWithdrawalTransactionTag = this.configService.get<string>(
      'APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG',
    );

    this.dinamicWithdrawalTransactionTag = this.configService.get<string>(
      'APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG',
    );

    this.dinamicChangeTransactionTag = this.configService.get<string>(
      'APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG',
    );

    if (
      !this.pixDepositDevolutionIntervalDays ||
      !this.staticWithdrawalTransactionTag ||
      !this.dinamicWithdrawalTransactionTag ||
      !this.dinamicChangeTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixDepositDevolutionIntervalDays
          ? ['APP_PIX_DEPOSIT_DEVOLUTION_INTERVAL_DAYS']
          : []),
        ...(!this.staticWithdrawalTransactionTag
          ? ['APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG']
          : []),
        ...(!this.dinamicWithdrawalTransactionTag
          ? ['APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG']
          : []),
        ...(!this.dinamicChangeTransactionTag
          ? ['APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG']
          : []),
      ]);
    }
  }

  /**
   * Consumer of create devolution.
   *
   * @param devolutionRepository Devolution repository.
   * @param depositRepository Deposit repository.
   * @param eventEmitter Devolution event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION.CREATE)
  async execute(
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    eventEmitter: PixDevolutionEventEmitterControllerInterface,
    @LoggerParam(CreatePixDevolutionMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreatePixDevolutionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreatePixDevolutionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreatePixDevolutionRequest(message);

    logger.info('Create devolution from user.', { payload });

    // Create and call create devolution controller.
    const controller = new CreatePixDevolutionController(
      logger,
      devolutionRepository,
      depositRepository,
      eventEmitter,
      this.pixPaymentDevolutionMaxNumber,
      this.pixDepositDevolutionIntervalDays,
      this.staticWithdrawalTransactionTag,
      this.dinamicWithdrawalTransactionTag,
      this.dinamicChangeTransactionTag,
    );

    // Create devolution
    const devolution = await controller.execute(payload);

    logger.info('Devolution created.', { devolution });

    return {
      ctx,
      value: devolution,
    };
  }
}
