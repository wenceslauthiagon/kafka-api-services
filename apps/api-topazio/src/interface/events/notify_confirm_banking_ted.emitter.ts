import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-topazio/domain';
import {
  NotifyConfirmBankingTedEvent,
  NotifyConfirmBankingTedEventEmitter,
} from '@zro/api-topazio/application';

export enum NotifyConfirmBankingTedEventType {
  ERROR = 'ERROR',
}

type TNotifyConfirmBankingTedControllerEvent = NotifyConfirmBankingTedEvent;

export class NotifyConfirmBankingTedControllerEvent
  extends AutoValidator
  implements TNotifyConfirmBankingTedControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  transactionId: string;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyConfirmBankingTedControllerEvent) {
    super(props);
  }
}

export interface NotifyConfirmBankingTedEventEmitterControllerInterface {
  /**
   * Emit bankingTed event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitConfirmEvent: (
    eventName: NotifyConfirmBankingTedEventType,
    event: NotifyConfirmBankingTedControllerEvent,
  ) => void;
}

export class NotifyConfirmBankingTedEventEmitterController
  implements NotifyConfirmBankingTedEventEmitter
{
  constructor(
    private eventEmitter: NotifyConfirmBankingTedEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyConfirmBankingTed(event: NotifyConfirmBankingTedEvent): void {
    const controllerEvent = new NotifyConfirmBankingTedControllerEvent({
      id: event.id,
      transactionId: event.transactionId,
      state: event.state,
    });

    this.eventEmitter.emitConfirmEvent(
      NotifyConfirmBankingTedEventType.ERROR,
      controllerEvent,
    );
  }
}
