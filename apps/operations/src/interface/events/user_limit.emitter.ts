import { IsInt, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  UserLimitEvent,
  UserLimitEventEmitter,
} from '@zro/operations/application';
import { Operation } from '@zro/operations/domain';

export enum UserLimitEventType {
  UPDATED = 'UPDATED',
  CREATED = 'CREATED',
}

type UserId = User['id'];

type TUserLimitControllerEvent = {
  userId: UserId;
  value?: Operation['value'];
} & Pick<UserLimitEvent, 'id'>;

export class UserLimitControllerEvent
  extends AutoValidator
  implements TUserLimitControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @IsPositive()
  userId: UserId;

  @IsOptional()
  @IsInt()
  @Min(0)
  value: Operation['value'];

  contructor(props: TUserLimitControllerEvent) {
    Object.assign(this, props);
  }
}

export interface UserLimitEventEmitterControllerInterface {
  /**
   * Emit operation event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitUserLimitEvent: (
    eventName: UserLimitEventType,
    event: UserLimitControllerEvent,
  ) => void;
}

export class UserLimitEventEmitterController implements UserLimitEventEmitter {
  constructor(private eventEmitter: UserLimitEventEmitterControllerInterface) {}

  /**
   * Emit updated event.
   * @param event Data.
   */
  updatedUserLimit(event: UserLimitEvent): void {
    const controllerEvent = new UserLimitControllerEvent({
      id: event.id,
      userId: event.user.id,
    });

    this.eventEmitter.emitUserLimitEvent(
      UserLimitEventType.UPDATED,
      controllerEvent,
    );
  }

  /**
   * Emit created event.
   * @param event Data.
   */
  createdUserLimit(event: UserLimitEvent): void {
    const controllerEvent = new UserLimitControllerEvent({
      id: event.id,
      userId: event.user.id,
      value: event.value,
    });

    this.eventEmitter.emitUserLimitEvent(
      UserLimitEventType.CREATED,
      controllerEvent,
    );
  }
}
