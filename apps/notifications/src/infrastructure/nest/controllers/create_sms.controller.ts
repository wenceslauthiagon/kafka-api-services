import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EncryptService,
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  SmsRepository,
  SmsTemplateRepository,
} from '@zro/notifications/domain';
import {
  SmsEventEmitterController,
  CreateSmsController,
  CreateSmsRequest,
  CreateSmsResponse,
} from '@zro/notifications/interface';
import {
  KAFKA_TOPICS,
  SmsDatabaseRepository,
  SmsTemplateDatabaseRepository,
  SmsEventKafkaEmitter,
} from '@zro/notifications/infrastructure';

export type CreateSmsKafkaRequest = KafkaMessage<CreateSmsRequest>;
export type CreateSmsKafkaResponse = KafkaResponse<CreateSmsResponse>;

/**
 * Sms controller.
 */
@Controller()
@MicroserviceController()
export class CreateSmsMicroserviceController {
  /**
   * Default sms RPC controller constructor.
   *
   * @param encryptService
   */
  constructor(private encryptService: EncryptService) {}

  /**
   * Consumer of create sms.
   *
   * @param message Request Kafka message.
   * @param smsRepository Sms repository.
   * @param smsTemplateRepository Template repository.
   * @param smsEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SMS.CREATE)
  async execute(
    @Payload('value') message: CreateSmsRequest,
    @RepositoryParam(SmsDatabaseRepository)
    smsRepository: SmsRepository,
    @RepositoryParam(SmsTemplateDatabaseRepository)
    smsTemplateRepository: SmsTemplateRepository,
    @EventEmitterParam(SmsEventKafkaEmitter)
    smsEventEmitter: SmsEventEmitterController,
    @LoggerParam(CreateSmsMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateSmsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateSmsRequest(message);

    logger.debug('Send sms.', { payload });

    // Create and call send sms controller.
    const controller = new CreateSmsController(
      logger,
      smsRepository,
      smsTemplateRepository,
      smsEventEmitter,
      this.encryptService,
    );

    // Created sms
    const sms = await controller.execute(payload);

    logger.debug('Sms created.', { sms });

    return {
      ctx,
      value: sms,
    };
  }
}
