import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  BellNotification,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  BellNotificationEventEmitter,
  BellNotificationNotFoundException,
  PushNotificationGateway,
  UserService,
} from '@zro/notifications/application';
import { UserNotFoundException } from '@zro/users/application';

/**
 * Handle bell notification creation.
 */
export class HandleBellNotificationCreatedUseCase {
  /**
   * Default constructor.
   * @param bellNotificationRepository Bell notification repository.
   * @param bellNotificationEventEmitter Bell notification event emitter.
   * @param userService User Service.
   * @param pushNotificationGateway Push notification repository.
   * @param logger System logger.
   */
  constructor(
    private bellNotificationRepository: BellNotificationRepository,
    private bellNotificationEventEmitter: BellNotificationEventEmitter,
    private pushNotificationGateway: PushNotificationGateway,
    private readonly userService: UserService,
    private logger: Logger,
  ) {
    this.logger = logger.child({
      context: HandleBellNotificationCreatedUseCase.name,
    });
  }

  /**
   * Handle created push notification.
   * @param uuid Bell notification defined UUID.
   * @returns Bell notification.
   */
  async execute(uuid: string): Promise<BellNotification> {
    this.logger.debug('Sending bell notification', { uuid });

    if (!uuid) {
      throw new MissingDataException(['uuid']);
    }

    // Get bell notification data.
    const bellNotification =
      await this.bellNotificationRepository.getByUuid(uuid);

    // Sanity check.
    if (!bellNotification) {
      throw new BellNotificationNotFoundException(uuid);
    }

    const userFound = await this.userService.getUserByUuid(
      bellNotification.user,
    );

    this.logger.debug('Found user.', { user: userFound });

    if (!userFound?.active) {
      throw new UserNotFoundException(userFound);
    }

    Object.assign(bellNotification.user, userFound);

    // Send bell notification
    await this.pushNotificationGateway.send(bellNotification);

    // Fire bell notification sent event
    this.bellNotificationEventEmitter.sentPushNotification(bellNotification);

    return bellNotification;
  }
}
