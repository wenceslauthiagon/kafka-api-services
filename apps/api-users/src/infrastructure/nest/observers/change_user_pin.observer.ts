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
import { UserControllerEvent } from '@zro/users/interface';
import { KAFKA_EVENTS } from '@zro/users/infrastructure';

export type HandleChangeUserPinEventKafkaRequest =
  KafkaMessage<UserControllerEvent>;

/**
 * This observer check user event when add or update pin. If any authorization exists in cache, will be deleted.
 */
@Controller()
@ObserverController()
export class ChangeUserPinNestObserver {
  constructor(private redisService: RedisService) {}
  /**
   * Handle user pin event.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.USER.ADD_PIN)
  async handleAddPinEvent(
    @Payload('value') message: UserControllerEvent,
    @LoggerParam(ChangeUserPinNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    return this.handle(message, logger);
  }

  @KafkaEventPattern(KAFKA_EVENTS.USER.UPDATE_PIN)
  async handleUpdatePinEvent(
    @Payload('value') message: UserControllerEvent,
    @LoggerParam(ChangeUserPinNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    return this.handle(message, logger);
  }

  private async handle(message: UserControllerEvent, logger: Logger) {
    try {
      // Check if a previous hash exists.
      const hashCached = await this.redisService.get<string>(
        `authorization-${message.uuid}`,
      );

      if (hashCached) {
        const hash = hashCached.data;
        const userCached = await this.redisService.get<AuthUser>(
          `authorization-${hash}`,
        );

        // Then, delete this user from cache
        if (userCached) {
          await this.redisService.delete(`authorization-${message.uuid}`);
          await this.redisService.delete(`authorization-${hash}`);

          logger.debug('Hash cached deleted after add or update user pin.');
        }
      }

      logger.info('Change user pin event handled.');
    } catch (error) {
      logger.error('Failed to handle user pin event.', { error });
      // TODO: Send message to slack IT team
    }
  }
}
