import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-topazio/domain';
import {
  NotifyClaimEvent,
  NotifyClaimEventEmitter,
} from '@zro/api-topazio/application';

export enum NotifyClaimEventType {
  ERROR = 'ERROR',
}

type TNotifyClaimControllerEvent = NotifyClaimEvent;

export class NotifyClaimControllerEvent
  extends AutoValidator
  implements TNotifyClaimControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  requestId: string;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyClaimControllerEvent) {
    super(props);
  }
}

export interface NotifyClaimEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitClaimEvent: (
    eventName: NotifyClaimEventType,
    event: NotifyClaimControllerEvent,
  ) => void;
}

export class NotifyClaimEventEmitterController
  implements NotifyClaimEventEmitter
{
  constructor(
    private eventEmitter: NotifyClaimEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyClaim(event: NotifyClaimEvent): void {
    const controllerEvent = new NotifyClaimControllerEvent({
      id: event.id,
      requestId: event.id,
      state: event.state,
    });

    this.eventEmitter.emitClaimEvent(
      NotifyClaimEventType.ERROR,
      controllerEvent,
    );
  }
}
