import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { NotifyStateType } from '@zro/api-topazio/domain';
import {
  NotifyRegisterBankingTedEvent,
  NotifyRegisterBankingTedEventEmitter,
} from '@zro/api-topazio/application';

export enum NotifyRegisterBankingTedEventType {
  ERROR = 'ERROR',
}

type TNotifyRegisterBankingTedControllerEvent = NotifyRegisterBankingTedEvent;

export class NotifyRegisterBankingTedControllerEvent
  extends AutoValidator
  implements TNotifyRegisterBankingTedControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  transactionId: string;

  @IsEnum(NotifyStateType)
  state: NotifyStateType;

  constructor(props: TNotifyRegisterBankingTedControllerEvent) {
    super(props);
  }
}

export interface NotifyRegisterBankingTedEventEmitterControllerInterface {
  /**
   * Emit bankingTed event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitRegisterEvent: (
    eventName: NotifyRegisterBankingTedEventType,
    event: NotifyRegisterBankingTedControllerEvent,
  ) => void;
}

export class NotifyRegisterBankingTedEventEmitterController
  implements NotifyRegisterBankingTedEventEmitter
{
  constructor(
    private eventEmitter: NotifyRegisterBankingTedEventEmitterControllerInterface,
  ) {}

  /**
   * Emit error event.
   * @param event Data.
   */
  errorNotifyRegisterBankingTed(event: NotifyRegisterBankingTedEvent): void {
    const controllerEvent = new NotifyRegisterBankingTedControllerEvent({
      id: event.id,
      transactionId: event.transactionId,
      state: event.state,
    });

    this.eventEmitter.emitRegisterEvent(
      NotifyRegisterBankingTedEventType.ERROR,
      controllerEvent,
    );
  }
}
