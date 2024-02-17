import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  EventEmitterParam,
} from '@zro/common';
import { SignupRepository } from '@zro/signup/domain';
import { UserService } from '@zro/signup/application';
import {
  SignupDatabaseRepository,
  KAFKA_EVENTS,
  UserServiceKafka,
  SignupEventKafkaEmitter,
} from '@zro/signup/infrastructure';
import {
  HandleConfirmedSignupEventController,
  HandleConfirmedSignupEventRequest,
  SignupEventEmitterControllerInterface,
} from '@zro/signup/interface';

export type HandleConfirmedSignupEventKafkaRequest =
  KafkaMessage<HandleConfirmedSignupEventRequest>;

/**
 * Signup events observer.
 */
@Controller()
@ObserverController()
export class HandleConfirmedSignupNestObserver {
  /**
   * Handler triggered when key was added successfully to DICT.
   *
   * @param message Event Kafka message.
   * @param signupRepository Signup repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway Signup psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.SIGNUP.CONFIRMED)
  async handleConfirmedSignupEventViaTopazio(
    @Payload('value') message: HandleConfirmedSignupEventRequest,
    @RepositoryParam(SignupDatabaseRepository)
    signupRepository: SignupRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @EventEmitterParam(SignupEventKafkaEmitter)
    signupEventEmitter: SignupEventEmitterControllerInterface,
    @LoggerParam(HandleConfirmedSignupNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleConfirmedSignupEventRequest(message);

    logger.info('Handle confirmed signup.', { payload });

    const controller = new HandleConfirmedSignupEventController(
      logger,
      signupRepository,
      userService,
      signupEventEmitter,
    );

    // Call handle controller.
    await controller.execute(payload);
  }
}
