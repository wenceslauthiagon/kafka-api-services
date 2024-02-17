import {
  IsUUID,
  IsNotEmpty,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserForgotPasswordState } from '@zro/users/domain';
import {
  UserForgotPasswordEvent,
  UserForgotPasswordEventEmitter,
} from '@zro/users/application';

export enum UserForgotPasswordEventType {
  CREATED = 'CREATED',
  DECLINED = 'DECLINED',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
}

type TUserForgotPasswordControllerEvent = Pick<
  UserForgotPasswordEvent,
  'id' | 'state' | 'phoneNumber'
> & {
  userId: User['uuid'];
};

export class UserForgotPasswordControllerEvent
  extends AutoValidator
  implements TUserForgotPasswordControllerEvent
{
  @IsUUID()
  id: string;

  @IsEnum(UserForgotPasswordState)
  state: UserForgotPasswordState;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  @IsUUID()
  userId: User['uuid'];

  constructor(props: TUserForgotPasswordControllerEvent) {
    super(props);
  }
}

export interface UserForgotPasswordEventEmitterControllerInterface {
  /**
   * Emit user forgot password event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitUserForgotPasswordEvent(
    eventName: UserForgotPasswordEventType,
    event: UserForgotPasswordControllerEvent,
  ): void;
}

export class UserForgotPasswordEventEmitterController
  implements UserForgotPasswordEventEmitter
{
  constructor(
    private eventEmitter: UserForgotPasswordEventEmitterControllerInterface,
  ) {}

  /**
   * Emit created user forgot password event.
   * @param event Data.
   */
  created(event: UserForgotPasswordEvent): void {
    const controllerEvent = new UserForgotPasswordControllerEvent({
      id: event.id,
      state: event.state,
      phoneNumber: event.phoneNumber,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserForgotPasswordEvent(
      UserForgotPasswordEventType.CREATED,
      controllerEvent,
    );
  }

  /**
   * Emit declined user forgot password event.
   * @param event Data.
   */
  declined(event: UserForgotPasswordEvent): void {
    const controllerEvent = new UserForgotPasswordControllerEvent({
      id: event.id,
      state: event.state,
      phoneNumber: event.phoneNumber,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserForgotPasswordEvent(
      UserForgotPasswordEventType.DECLINED,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed user forgot password event.
   * @param event Data.
   */
  confirmed(event: UserForgotPasswordEvent): void {
    const controllerEvent = new UserForgotPasswordControllerEvent({
      id: event.id,
      state: event.state,
      phoneNumber: event.phoneNumber,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserForgotPasswordEvent(
      UserForgotPasswordEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit expired user forgot password event.
   * @param event Data.
   */
  expired(event: UserForgotPasswordEvent): void {
    const controllerEvent = new UserForgotPasswordControllerEvent({
      id: event.id,
      state: event.state,
      phoneNumber: event.phoneNumber,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserForgotPasswordEvent(
      UserForgotPasswordEventType.EXPIRED,
      controllerEvent,
    );
  }
}
