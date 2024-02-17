import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import { CashbackEvent, CashbackEventEmitter } from '@zro/otc/application';

export enum CashbackEventType {
  READY = 'READY',
}

type UserId = User['uuid'];

type TCashbackControllerEvent = { userId: UserId } & Pick<CashbackEvent, 'id'>;

export class CashbackControllerEvent
  extends AutoValidator
  implements TCashbackControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: string;

  constructor(props: TCashbackControllerEvent) {
    super(props);
  }
}

export interface CashbackEventEmitterControllerInterface {
  /**
   * Emit conversion event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCashbackEvent: (
    eventName: CashbackEventType,
    event: CashbackControllerEvent,
  ) => void;
}

export class CashbackEventEmitterController implements CashbackEventEmitter {
  constructor(private eventEmitter: CashbackEventEmitterControllerInterface) {}

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyCashback(event: CashbackEvent): void {
    const controllerEvent = new CashbackControllerEvent({
      id: event.id,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitCashbackEvent(
      CashbackEventType.READY,
      controllerEvent,
    );
  }
}
