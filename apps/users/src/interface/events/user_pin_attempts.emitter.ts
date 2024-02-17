import {
  UserPinAttemptsEvent,
  UserPinAttemptsEventEmitter,
} from '@zro/users/application';
import { UserPinAttempts } from '@zro/users/domain';

export enum UserPinAttemptsEventType {
  UPDATED = 'UPDATED',
}

export interface UserPinAttemptsEventEmitterControllerInterface {
  /**
   * Emit a user pin attempt event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitUserPinAttemptsEvent: <T extends UserPinAttemptsEvent>(
    eventName: UserPinAttemptsEventType,
    event: T,
  ) => void;
}

export class UserPinAttemptsEventEmitterController
  implements UserPinAttemptsEventEmitter
{
  constructor(
    private eventEmitter: UserPinAttemptsEventEmitterControllerInterface,
  ) {}

  /**
   * Emit updated user pin attempts event.
   * @param userPinAttempts Data.
   */
  updatedUserPinAttempts(userPinAttempts: UserPinAttempts): void {
    const event: UserPinAttemptsEvent = {
      id: userPinAttempts.uuid,
      userId: userPinAttempts.user.uuid,
      updatedAt: userPinAttempts.updatedAt,
      attempts: userPinAttempts.attempts,
    };

    this.eventEmitter.emitUserPinAttemptsEvent(
      UserPinAttemptsEventType.UPDATED,
      event,
    );
  }
}
