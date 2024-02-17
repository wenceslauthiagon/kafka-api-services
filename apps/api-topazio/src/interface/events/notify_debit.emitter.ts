import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-topazio/domain';
import {
  NotifyDebitEvent,
  NotifyDebitEventEmitter,
} from '@zro/api-topazio/application';

export enum NotifyDebitEventType {
  ERROR = 'ERROR',
}

type TNotifyDebitControllerEvent = NotifyDebitEvent;

export class NotifyDebitControllerEvent
  extends AutoValidator
  implements TNotifyDebitControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  transactionId: string;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyDebitControllerEvent) {
    super(props);
  }
}

export interface NotifyDebitEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDebitEvent: (
    eventName: NotifyDebitEventType,
    event: NotifyDebitControllerEvent,
  ) => void;
}

export class NotifyDebitEventEmitterController
  implements NotifyDebitEventEmitter
{
  constructor(
    private eventEmitter: NotifyDebitEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyDebit(event: NotifyDebitEvent): void {
    const controllerEvent = new NotifyDebitControllerEvent({
      id: event.id,
      transactionId: event.transactionId,
      state: event.state,
    });

    this.eventEmitter.emitDebitEvent(
      NotifyDebitEventType.ERROR,
      controllerEvent,
    );
  }
}
