import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
} from '@zro/common';
import {
  JdpiPixPaymentInterceptor,
  JdpiPixPaymentGatewayParam,
} from '@zro/jdpi';
import { DecodedQrCodeRepository } from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  KAFKA_TOPICS,
  DecodedQrCodeDatabaseRepository,
  DecodeQrCodeEventKafkaEmitter,
  UserServiceKafka,
  BankingServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateDecodedQrCodeRequest,
  CreateDecodedQrCodeResponse,
  CreateDecodedQrCodeController,
  DecodeQrCodeEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreateDecodedQrCodeKafkaRequest =
  KafkaMessage<CreateDecodedQrCodeRequest>;

export type CreateDecodedQrCodeKafkaResponse =
  KafkaResponse<CreateDecodedQrCodeResponse>;

/**
 * Create DecodeQrCode controller.
 */
@Controller()
@MicroserviceController([JdpiPixPaymentInterceptor])
export class CreateDecodedQrCodeMicroserviceController {
  /**
   * Consumer of decode Qr code.
   *
   * @param decodedQrCodeRepository DecodedQrCode repository.
   * @param decodeQrCodeEventEmitter DecodedQrCode event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DECODED_QR_CODE.CREATE)
  async execute(
    @LoggerParam(CreateDecodedQrCodeMicroserviceController)
    logger: Logger,
    @RepositoryParam(DecodedQrCodeDatabaseRepository)
    decodedQrCodeRepository: DecodedQrCodeRepository,
    @EventEmitterParam(DecodeQrCodeEventKafkaEmitter)
    decodeQrCodeEventEmitter: DecodeQrCodeEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pixPaymentGateway: PixPaymentGateway,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @Payload('value') message: CreateDecodedQrCodeRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateDecodedQrCodeKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateDecodedQrCodeRequest(message);

    logger.info('Decode QR Code from user.', { payload });

    // Create and call decode QR code by user and key controller.
    const controller = new CreateDecodedQrCodeController(
      logger,
      decodedQrCodeRepository,
      decodeQrCodeEventEmitter,
      pixPaymentGateway,
      userService,
      bankingService,
    );

    // Decode QR code
    const decodedQrCode = await controller.execute(payload);

    logger.info('QR code decoded.', { decodedQrCode });

    return {
      ctx,
      value: decodedQrCode,
    };
  }
}
