import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  UserLimitRequestEvent,
  UserLimitRequestEventEmitter,
} from '@zro/compliance/application';
import {
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import { User } from '@zro/users/domain';

export enum UserLimitRequestEventType {
  OPEN_PENDING = 'OPEN_PENDING',
  OPEN_CONFIRMED = 'OPEN_CONFIRMED',
  CLOSED_CONFIRMED_APPROVED = 'CLOSED_CONFIRMED_APPROVED',
  CLOSED_CONFIRMED_REJECTED = 'CLOSED_CONFIRMED_REJECTED',
}

type UserId = User['uuid'];

type TUserLimitRequestControllerEvent = Pick<
  UserLimitRequestEvent,
  'id' | 'status' | 'state'
> & { userId?: UserId };

export class UserLimitRequestControllerEvent
  extends AutoValidator
  implements Omit<TUserLimitRequestControllerEvent, 'user'>
{
  @IsUUID()
  id: string;

  @IsEnum(UserLimitRequestStatus)
  status: UserLimitRequestStatus;

  @IsEnum(UserLimitRequestState)
  state: UserLimitRequestState;

  @IsOptional()
  @IsUUID(4)
  userId?: string;

  constructor(props: TUserLimitRequestControllerEvent) {
    super(props);
  }
}

export interface UserLimitRequestEventEmitterControllerInterface {
  /**
   * Emit user event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitUserLimitRequestEvent(
    eventName: UserLimitRequestEventType,
    event: UserLimitRequestControllerEvent,
  ): void;
}

export class UserLimitRequestEventEmitterController
  implements UserLimitRequestEventEmitter
{
  constructor(
    private eventEmitter: UserLimitRequestEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending user limit request event.
   * @param event Data.
   */
  openPending(event: UserLimitRequestEvent): void {
    const controllerEvent = new UserLimitRequestControllerEvent({
      id: event.id,
      status: event.status,
      state: event.state,
    });

    this.eventEmitter.emitUserLimitRequestEvent(
      UserLimitRequestEventType.OPEN_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed user limit request event.
   * @param event Data.
   */
  openConfirmed(event: UserLimitRequestEvent): void {
    const controllerEvent = new UserLimitRequestControllerEvent({
      id: event.id,
      status: event.status,
      state: event.state,
    });

    this.eventEmitter.emitUserLimitRequestEvent(
      UserLimitRequestEventType.OPEN_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit closed confirmed approved user limit request event.
   * @param event Data.
   */
  closedConfirmedApproved(event: UserLimitRequestEvent): void {
    const controllerEvent = new UserLimitRequestControllerEvent({
      id: event.id,
      status: event.status,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserLimitRequestEvent(
      UserLimitRequestEventType.CLOSED_CONFIRMED_APPROVED,
      controllerEvent,
    );
  }

  /**
   * Emit closed confirmed rejected user limit request event.
   * @param event Data.
   */
  closedConfirmedRejected(event: UserLimitRequestEvent): void {
    const controllerEvent = new UserLimitRequestControllerEvent({
      id: event.id,
      status: event.status,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserLimitRequestEvent(
      UserLimitRequestEventType.CLOSED_CONFIRMED_REJECTED,
      controllerEvent,
    );
  }
}
