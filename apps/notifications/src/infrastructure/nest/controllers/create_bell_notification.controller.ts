import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { BellNotificationRepository } from '@zro/notifications/domain';
import { UserService } from '@zro/notifications/application';
import {
  BellNotificationDatabaseRepository,
  UserServiceKafka,
  KAFKA_TOPICS,
  BellNotificationEventKafkaEmitter,
} from '@zro/notifications/infrastructure';
import {
  BellNotificationEventEmitterControllerInterface,
  CreateBellNotificationController,
  CreateBellNotificationRequest,
  CreateBellNotificationResponse,
} from '@zro/notifications/interface';

export type CreateBellNotificationKafkaRequest =
  KafkaMessage<CreateBellNotificationRequest>;

export type CreateBellNotificationKafkaResponse =
  KafkaResponse<CreateBellNotificationResponse>;

/**
 * Bell notification controller.
 */
@Controller()
@MicroserviceController()
export class CreateBellNotificationMicroserviceController {
  /**
   * Default bell notification RPC controller constructor.
   */

  /**
   * Consumer of create bell notification.
   * @param bellNotificationRepository Bell notification repository.
   * @param bellNotificationEventEmitter Bell notification event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BELL_NOTIFICATION.CREATE)
  async execute(
    @RepositoryParam(BellNotificationDatabaseRepository)
    bellNotificationRepository: BellNotificationRepository,
    @EventEmitterParam(BellNotificationEventKafkaEmitter)
    bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @LoggerParam(CreateBellNotificationMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateBellNotificationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateBellNotificationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateBellNotificationRequest(message);

    logger.debug('Create bell notification from user.', { payload });

    // Create and call create bell notification controller.
    const controller = new CreateBellNotificationController(
      logger,
      bellNotificationRepository,
      bellNotificationEventEmitter,
      userService,
    );

    // Created bell notification
    const bellNotification = await controller.execute(payload);

    logger.debug('Bell notification created.', { bellNotification });

    return {
      ctx,
      value: bellNotification,
    };
  }
}
