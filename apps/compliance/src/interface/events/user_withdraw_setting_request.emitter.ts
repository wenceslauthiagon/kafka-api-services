import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  UserWithdrawSettingRequestEvent,
  UserWithdrawSettingRequestEventEmitter,
} from '@zro/compliance/application';
import { UserWithdrawSettingRequestState } from '@zro/compliance/domain';
import { User } from '@zro/users/domain';

export enum UserWithdrawSettingRequestEventType {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  FAILED_BY_DOCUMENT = 'FAILED_BY_DOCUMENT',
}

type UserId = User['uuid'];

type TUserWithdrawSettingRequestControllerEvent = Omit<
  UserWithdrawSettingRequestEvent,
  'user'
> & {
  userId: UserId;
};

export class UserWithdrawSettingRequestControllerEvent
  extends AutoValidator
  implements TUserWithdrawSettingRequestControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsEnum(UserWithdrawSettingRequestState)
  state: UserWithdrawSettingRequestState;

  @IsUUID(4)
  userId: UserId;

  constructor(props: TUserWithdrawSettingRequestControllerEvent) {
    super(props);
  }
}

export interface UserWithdrawSettingRequestEventEmitterControllerInterface {
  /**
   * Emit user event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitUserWithdrawSettingRequestEvent(
    eventName: UserWithdrawSettingRequestEventType,
    event: UserWithdrawSettingRequestControllerEvent,
  ): void;
}

export class UserWithdrawSettingRequestEventEmitterController
  implements UserWithdrawSettingRequestEventEmitter
{
  constructor(
    private eventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending user withdraw setting request event.
   * @param event Data.
   */
  pending(event: UserWithdrawSettingRequestEvent): void {
    const controllerEvent = new UserWithdrawSettingRequestControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserWithdrawSettingRequestEvent(
      UserWithdrawSettingRequestEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit failed user withdraw setting request event.
   * @param event Data.
   */
  failed(event: UserWithdrawSettingRequestEvent): void {
    const controllerEvent = new UserWithdrawSettingRequestControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserWithdrawSettingRequestEvent(
      UserWithdrawSettingRequestEventType.FAILED,
      controllerEvent,
    );
  }

  /**
   * Emit open user withdraw setting request event.
   * @param event Data.
   */
  open(event: UserWithdrawSettingRequestEvent): void {
    const controllerEvent = new UserWithdrawSettingRequestControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserWithdrawSettingRequestEvent(
      UserWithdrawSettingRequestEventType.OPEN,
      controllerEvent,
    );
  }

  /**
   * Emit approved user withdraw setting request event.
   * @param event Data.
   */
  approved(event: UserWithdrawSettingRequestEvent): void {
    const controllerEvent = new UserWithdrawSettingRequestControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserWithdrawSettingRequestEvent(
      UserWithdrawSettingRequestEventType.APPROVED,
      controllerEvent,
    );
  }

  /**
   * Emit rejected user withdraw setting request event.
   * @param event Data.
   */
  rejected(event: UserWithdrawSettingRequestEvent): void {
    const controllerEvent = new UserWithdrawSettingRequestControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitUserWithdrawSettingRequestEvent(
      UserWithdrawSettingRequestEventType.REJECTED,
      controllerEvent,
    );
  }
}
