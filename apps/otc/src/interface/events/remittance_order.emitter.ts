import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  RemittanceOrderEvent,
  RemittanceOrderEventEmitter,
} from '@zro/otc/application';

export enum RemittanceOrderEventType {
  CREATED = 'CREATED',
  CLOSED = 'CLOSED',
}

type TRemittanceOrderControllerEvent = Pick<RemittanceOrderEvent, 'id'>;

export class RemittanceOrderControllerEvent
  extends AutoValidator
  implements TRemittanceOrderControllerEvent
{
  @IsUUID(4)
  id: string;

  constructor(props: TRemittanceOrderControllerEvent) {
    super(props);
  }
}

export interface RemittanceOrderEventEmitterControllerInterface {
  /**
   * Emit remittance order event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitRemittanceOrderEvent: (
    eventName: RemittanceOrderEventType,
    event: RemittanceOrderControllerEvent,
  ) => void;
}

export class RemittanceOrderEventEmitterController
  implements RemittanceOrderEventEmitter
{
  constructor(
    private eventEmitter: RemittanceOrderEventEmitterControllerInterface,
  ) {}

  /**
   * Emit created event.
   * @param event Data.
   */
  createdRemittanceOrder(event: RemittanceOrderEvent): void {
    const controllerEvent = new RemittanceOrderControllerEvent({
      id: event.id,
    });

    this.eventEmitter.emitRemittanceOrderEvent(
      RemittanceOrderEventType.CREATED,
      controllerEvent,
    );
  }

  /**
   * Emit closed event.
   * @param event Data.
   */
  closedRemittanceOrder(event: RemittanceOrderEvent): void {
    const controllerEvent = new RemittanceOrderControllerEvent({
      id: event.id,
    });

    this.eventEmitter.emitRemittanceOrderEvent(
      RemittanceOrderEventType.CLOSED,
      controllerEvent,
    );
  }
}
