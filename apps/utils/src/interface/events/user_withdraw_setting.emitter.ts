import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  UserWithdrawSettingEvent,
  UserWithdrawSettingEventEmitter,
} from '@zro/utils/application';
import { WithdrawSettingState } from '@zro/utils/domain';

export enum UserWithdrawSettingEventType {
  CREATED = 'CREATED',
}

type TUserWithdrawSettingControllerEvent = Pick<
  UserWithdrawSettingEvent,
  'id' | 'state'
>;

export class UserWithdrawSettingControllerEvent
  extends AutoValidator
  implements TUserWithdrawSettingControllerEvent
{
  @IsUUID()
  id: string;

  @IsEnum(WithdrawSettingState)
  state: WithdrawSettingState;

  constructor(props: TUserWithdrawSettingControllerEvent) {
    super(props);
  }
}

export interface UserWithdrawSettingEventEmitterControllerInterface {
  /**
   * Emit user event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitUserWithdrawSettingEvent(
    eventName: UserWithdrawSettingEventType,
    event: UserWithdrawSettingControllerEvent,
  ): void;
}

export class UserWithdrawSettingEventEmitterController
  implements UserWithdrawSettingEventEmitter
{
  constructor(
    private eventEmitter: UserWithdrawSettingEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending user withdraw setting request event.
   * @param event Data.
   */
  created(event: UserWithdrawSettingEvent): void {
    const controllerEvent = new UserWithdrawSettingControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitUserWithdrawSettingEvent(
      UserWithdrawSettingEventType.CREATED,
      controllerEvent,
    );
  }
}
