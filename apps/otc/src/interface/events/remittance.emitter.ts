import { IsOptional, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { RemittanceEvent, RemittanceEventEmitter } from '@zro/otc/application';

export enum RemittanceEventType {
  CREATED = 'CREATED',
  CLOSED = 'CLOSED',
  WAITING = 'WAITING',
  MANUALLY_CLOSED = 'MANUALLY_CLOSED',
}

type TRemittanceControllerEvent = RemittanceEvent;

export class RemittanceControllerEvent
  extends AutoValidator
  implements TRemittanceControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  systemId?: string;

  constructor(props: TRemittanceControllerEvent) {
    super(props);
  }
}

export interface RemittanceEventEmitterControllerInterface {
  /**
   * Emit remittance event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitRemittanceEvent: (
    eventName: RemittanceEventType,
    event: RemittanceControllerEvent,
  ) => void;
}

export class RemittanceEventEmitterController
  implements RemittanceEventEmitter
{
  constructor(
    private eventEmitter: RemittanceEventEmitterControllerInterface,
  ) {}

  /**
   * Emit created event.
   * @param event Data.
   */
  createdRemittance(event: RemittanceEvent): void {
    const controllerEvent = new RemittanceControllerEvent({
      id: event.id,
    });

    this.eventEmitter.emitRemittanceEvent(
      RemittanceEventType.CREATED,
      controllerEvent,
    );
  }

  /**
   * Emit closed event.
   * @param event Data.
   */
  closedRemittance(event: RemittanceEvent): void {
    const controllerEvent = new RemittanceControllerEvent({
      id: event.id,
      systemId: event.systemId,
    });

    this.eventEmitter.emitRemittanceEvent(
      RemittanceEventType.CLOSED,
      controllerEvent,
    );
  }

  /**
   * Emit manually closed event.
   * @param event Data.
   */
  manuallyClosedRemittance(event: RemittanceEvent): void {
    const controllerEvent = new RemittanceControllerEvent({
      id: event.id,
      systemId: event.systemId,
    });

    this.eventEmitter.emitRemittanceEvent(
      RemittanceEventType.MANUALLY_CLOSED,
      controllerEvent,
    );
  }

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingRemittance(event: RemittanceEvent): void {
    const controllerEvent = new RemittanceControllerEvent({
      id: event.id,
    });

    this.eventEmitter.emitRemittanceEvent(
      RemittanceEventType.WAITING,
      controllerEvent,
    );
  }
}
