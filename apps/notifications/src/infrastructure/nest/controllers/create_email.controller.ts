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
  EmailRepository,
  EmailTemplateRepository,
} from '@zro/notifications/domain';
import {
  EmailEventEmitterController,
  CreateEmailController,
  CreateEmailRequest,
  CreateEmailResponse,
} from '@zro/notifications/interface';
import {
  KAFKA_TOPICS,
  EmailDatabaseRepository,
  EmailTemplateDatabaseRepository,
  EmailEventKafkaEmitter,
} from '@zro/notifications/infrastructure';

export type CreateEmailKafkaRequest = KafkaMessage<CreateEmailRequest>;

export type CreateEmailKafkaResponse = KafkaResponse<CreateEmailResponse>;

/**
 * Email controller.
 */
@Controller()
@MicroserviceController()
export class CreateEmailMicroserviceController {
  /**
   * Default email RPC controller constructor.
   *
   * @param encryptService
   */
  constructor(private encryptService: EncryptService) {}

  /**
   * Consumer of create email.
   *
   * @param message Request Kafka message.
   * @param emailRepository Email repository.
   * @param emailTemplateRepository Template repository.
   * @param emailEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.EMAIL.CREATE)
  async execute(
    @Payload('value') message: CreateEmailRequest,
    @RepositoryParam(EmailDatabaseRepository)
    emailRepository: EmailRepository,
    @RepositoryParam(EmailTemplateDatabaseRepository)
    emailTemplateRepository: EmailTemplateRepository,
    @EventEmitterParam(EmailEventKafkaEmitter)
    emailEventEmitter: EmailEventEmitterController,
    @LoggerParam(CreateEmailMicroserviceController)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateEmailKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateEmailRequest(message);

    logger.debug('Send email payload.', { payload });

    // Create and call send email controller.
    const controller = new CreateEmailController(
      logger,
      emailRepository,
      emailTemplateRepository,
      emailEventEmitter,
      this.encryptService,
    );

    // Created email
    const email = await controller.execute(payload);

    logger.debug('E-mail created.', { email });

    return {
      ctx,
      value: email,
    };
  }
}
