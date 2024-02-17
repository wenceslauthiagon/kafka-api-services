import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
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
  DecodedPixAccountRepository,
  DecodedQrCodeRepository,
  PaymentRepository,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixDevolutionRepository,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PaymentDatabaseRepository,
  DecodedQrCodeDatabaseRepository,
  DecodedPixAccountDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
  PixDepositDatabaseRepository,
  PixDevolutionDatabaseRepository,
  WarningPixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetReceiptByOperationIdController,
  GetReceiptByOperationIdRequest,
  GetReceiptByOperationIdResponse,
} from '@zro/pix-payments/interface';

export type GetReceiptByOperationIdKafkaRequest =
  KafkaMessage<GetReceiptByOperationIdRequest>;

export type GetReceiptByOperationIdKafkaResponse =
  KafkaResponse<GetReceiptByOperationIdResponse>;

export interface PaymentGetReceiptByOperationIdConfig {
  APP_PIX_DEPOSIT_DEVOLUTION_INTERVAL_DAYS: string;
}

/**
 * Get receipt by operation id payment controller.
 */
@Controller()
@MicroserviceController()
export class GetReceiptByOperationIdMicroserviceController {
  /**
   * The interval of days that a devolution can be requested.
   */
  private pixDepositDevolutionIntervalDays: number;
  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PaymentGetReceiptByOperationIdConfig>,
  ) {
    this.pixDepositDevolutionIntervalDays = this.configService.get<number>(
      'APP_PIX_DEPOSIT_DEVOLUTION_INTERVAL_DAYS',
    );

    if (!this.pixDepositDevolutionIntervalDays) {
      throw new MissingEnvVarException(
        'APP_PIX_DEPOSIT_DEVOLUTION_INTERVAL_DAYS',
      );
    }
  }

  /**
   * Consumer of GetReceiptByOperationId.
   *
   * @param paymentRepository Payment repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET_RECEIPT_BY_OPERATION_ID)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @RepositoryParam(DecodedQrCodeDatabaseRepository)
    decodedQrCodeRepository: DecodedQrCodeRepository,
    @RepositoryParam(DecodedPixAccountDatabaseRepository)
    decodedPixAccountRepository: DecodedPixAccountRepository,
    @RepositoryParam(WarningPixDevolutionDatabaseRepository)
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    @LoggerParam(GetReceiptByOperationIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetReceiptByOperationIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetReceiptByOperationIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetReceiptByOperationIdRequest(message);

    logger.info('Get receipt by operation id from user.', {
      userId: payload.userId,
    });

    // Get GetReceiptByOperationId controller.
    const controller = new GetReceiptByOperationIdController(
      logger,
      paymentRepository,
      depositRepository,
      devolutionRepository,
      devolutionReceivedRepository,
      decodedQrCodeRepository,
      decodedPixAccountRepository,
      warningPixDevolutionRepository,
      this.pixDepositDevolutionIntervalDays,
    );

    const receipt = await controller.execute(payload);

    logger.info('Receipt response.', { receipt });

    return {
      ctx,
      value: receipt,
    };
  }
}
