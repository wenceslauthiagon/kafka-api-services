import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-topazio/domain';
import {
  NotifyCreditEvent,
  NotifyCreditEventEmitter,
} from '@zro/api-topazio/application';

export enum NotifyCreditEventType {
  ERROR = 'ERROR',
}

type TNotifyCreditControllerEvent = NotifyCreditEvent;

export class NotifyCreditControllerEvent
  extends AutoValidator
  implements TNotifyCreditControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  transactionId: string;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyCreditControllerEvent) {
    super(props);
  }
}

export interface NotifyCreditEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCreditEvent: (
    eventName: NotifyCreditEventType,
    event: NotifyCreditControllerEvent,
  ) => void;
}

export class NotifyCreditEventEmitterController
  implements NotifyCreditEventEmitter
{
  constructor(
    private eventEmitter: NotifyCreditEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyCredit(event: NotifyCreditEvent): void {
    const controllerEvent = new NotifyCreditControllerEvent({
      id: event.id,
      transactionId: event.transactionId,
      state: event.state,
    });

    this.eventEmitter.emitCreditEvent(
      NotifyCreditEventType.ERROR,
      controllerEvent,
    );
  }
}
