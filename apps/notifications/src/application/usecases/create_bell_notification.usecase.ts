import { Logger } from 'winston';
import { MissingDataException, ForbiddenException } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  BellNotification,
  BellNotificationEntity,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  UserService,
  BellNotificationEventEmitter,
} from '@zro/notifications/application';
import { UserNotFoundException } from '@zro/users/application';

export class CreateBellNotificationUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param bellNotificationRepository Bell notification repository.
   * @param bellNotificationEventEmitter Bell notification event emitter.
   * @param userService User service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly bellNotificationRepository: BellNotificationRepository,
    private readonly bellNotificationEventEmitter: BellNotificationEventEmitter,
    private readonly userService: UserService,
  ) {
    this.logger = logger.child({ context: CreateBellNotificationUseCase.name });
  }

  /**
   * Create a bell notification
   * @param uuid
   * @param user
   * @param title
   * @param description
   * @param type
   * @returns Created bell notification
   */
  async execute(
    uuid: string,
    user: User,
    title: string,
    description: string,
    type: string,
  ): Promise<BellNotification> {
    // Check inputs
    if (!uuid || !user || !title || !description || !type) {
      throw new MissingDataException([
        ...(!uuid ? ['uuid'] : []),
        ...(!user ? ['User'] : []),
        ...(!title ? ['title'] : []),
        ...(!description ? ['description'] : []),
        ...(!type ? ['type'] : []),
      ]);
    }

    // Check Indepotent
    const foundBellNotification =
      await this.bellNotificationRepository.getByUuid(uuid);

    this.logger.debug('Check if bell notification already exists.', {
      bellNotification: foundBellNotification,
    });

    if (foundBellNotification) {
      if (foundBellNotification.user.uuid !== user.uuid) {
        throw new ForbiddenException();
      }
      return foundBellNotification;
    }

    const userFound = await this.userService.getUserByUuid(user);

    this.logger.debug('Found user.', { user: userFound });

    if (!userFound?.active) {
      throw new UserNotFoundException(userFound);
    }

    Object.assign(user, userFound);

    const bellNotification = new BellNotificationEntity({
      uuid,
      user,
      title,
      description,
      type,
    });

    // Save bellNotification on database
    await this.bellNotificationRepository.create(bellNotification);

    this.logger.debug('Added bell notification.', {
      bellNotification: bellNotification,
    });

    // Fire created event.
    this.bellNotificationEventEmitter.createdPushNotification(bellNotification);

    return bellNotification;
  }
}
