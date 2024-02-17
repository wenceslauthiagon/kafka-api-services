import {
  IsUUID,
  IsNotEmpty,
  IsEnum,
  IsString,
  IsInt,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { UserState } from '@zro/users/domain';
import { UserEvent, UserEventEmitter } from '@zro/users/application';

export enum UserEventType {
  PENDING = 'PENDING',
  UPDATE_PIN = 'UPDATE_PIN',
  ADD_PIN = 'ADD_PIN',
}

type TUserControllerEvent = Pick<
  UserEvent,
  'id' | 'uuid' | 'name' | 'state' | 'phoneNumber'
>;

export class UserControllerEvent
  extends AutoValidator
  implements TUserControllerEvent
{
  @IsUUID()
  uuid: string;

  @IsInt()
  @IsPositive()
  id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(UserState)
  state: UserState;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  phoneNumber: string;

  constructor(props: TUserControllerEvent) {
    super(props);
  }
}

export interface UserEventEmitterControllerInterface {
  /**
   * Emit user event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitUserEvent(eventName: UserEventType, event: UserControllerEvent): void;
}

export class UserEventEmitterController implements UserEventEmitter {
  constructor(private eventEmitter: UserEventEmitterControllerInterface) {}

  /**
   * Emit pending user event.
   * @param event Data.
   */
  pendingUser(event: UserEvent): void {
    const controllerEvent = new UserControllerEvent({
      id: event.id,
      uuid: event.uuid,
      name: event.name,
      phoneNumber: event.phoneNumber,
      state: event.state,
    });

    this.eventEmitter.emitUserEvent(UserEventType.PENDING, controllerEvent);
  }

  /**
   * Emit update user event.
   * @param event Data.
   */
  updatePinUser(event: UserEvent): void {
    const controllerEvent = new UserControllerEvent({
      id: event.id,
      uuid: event.uuid,
      name: event.name,
      phoneNumber: event.phoneNumber,
      state: event.state,
    });

    this.eventEmitter.emitUserEvent(UserEventType.UPDATE_PIN, controllerEvent);
  }

  /**
   * Emit add user event.
   * @param event Data.
   */
  addPinUser(event: UserEvent): void {
    const controllerEvent = new UserControllerEvent({
      id: event.id,
      uuid: event.uuid,
      name: event.name,
      phoneNumber: event.phoneNumber,
      state: event.state,
    });

    this.eventEmitter.emitUserEvent(UserEventType.ADD_PIN, controllerEvent);
  }
}
