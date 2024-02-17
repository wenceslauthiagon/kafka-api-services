import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  RedisService,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { UserForgotPasswordControllerEvent } from '@zro/users/interface';
import { KAFKA_EVENTS } from '@zro/users/infrastructure';

export type HandleChangeUserPasswordEventKafkaRequest =
  KafkaMessage<UserForgotPasswordControllerEvent>;

/**
 * This observer check user event when change password. If any authorization exists in cache, will be deleted.
 */
@Controller()
@ObserverController()
export class ChangeUserPasswordNestObserver {
  constructor(private redisService: RedisService) {}

  /**
   * Handle user pin event.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.USER_FORGOT_PASSWORD.CONFIRMED)
  async handleConfirmedPasswordEvent(
    @Payload('value') message: UserForgotPasswordControllerEvent,
    @LoggerParam(ChangeUserPasswordNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    return this.handle(message, logger);
  }

  private async handle(
    message: UserForgotPasswordControllerEvent,
    logger: Logger,
  ) {
    try {
      // Check if a previous hash exists.
      const hashCached = await this.redisService.get<string>(
        `authorization-${message.userId}`,
      );

      if (hashCached) {
        const hash = hashCached.data;
        const userCached = await this.redisService.get<AuthUser>(
          `authorization-${hash}`,
        );

        // Then, delete this user from cache
        if (userCached) {
          await this.redisService.delete(`authorization-${message.userId}`);
          await this.redisService.delete(`authorization-${hash}`);

          logger.debug('Hash cached deleted after change password.');
        }
      }

      logger.info('Change user password event handled.');
    } catch (error) {
      logger.error('Failed to handle user password event.', { error });
      // TODO: Send message to slack IT team
    }
  }
}
