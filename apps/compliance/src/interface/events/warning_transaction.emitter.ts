import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { WarningTransactionStatus } from '@zro/compliance/domain';
import {
  WarningTransactionEvent,
  WarningTransactionEventEmitter,
} from '@zro/compliance/application';

export enum WarningTransactionEventType {
  PENDING = 'PENDING',
  SENT = 'SENT',
  CLOSED = 'CLOSED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export type TWarningTransactionControllerEvent = Pick<
  WarningTransactionEvent,
  'id' | 'status'
>;

export class WarningTransactionControllerEvent
  extends AutoValidator
  implements TWarningTransactionControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsEnum(WarningTransactionStatus)
  status: WarningTransactionStatus;

  constructor(props: TWarningTransactionControllerEvent) {
    super(props);
  }
}

export interface WarningTransactionEventEmitterControllerInterface {
  /**
   * Emit WarningTransaction event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitWarningTransactionEvent: (
    eventName: WarningTransactionEventType,
    event: WarningTransactionControllerEvent,
  ) => void;
}

export class WarningTransactionEventEmitterController
  implements WarningTransactionEventEmitter
{
  constructor(
    private eventEmitter: WarningTransactionEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending warning transaction event.
   * @param event Data.
   */
  pendingWarningTransaction(event: WarningTransactionEvent): void {
    const controllerEvent = new WarningTransactionControllerEvent({
      id: event.id,
      status: event.status,
    });

    this.eventEmitter.emitWarningTransactionEvent(
      WarningTransactionEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit sent warning transaction event.
   * @param event Data.
   */
  sentWarningTransaction(event: WarningTransactionEvent): void {
    const controllerEvent = new WarningTransactionControllerEvent({
      id: event.id,
      status: event.status,
    });

    this.eventEmitter.emitWarningTransactionEvent(
      WarningTransactionEventType.SENT,
      controllerEvent,
    );
  }

  /**
   * Emit closed warning transaction event.
   * @param event Data.
   */
  closedWarningTransaction(event: WarningTransactionEvent): void {
    const controllerEvent = new WarningTransactionControllerEvent({
      id: event.id,
      status: event.status,
    });

    this.eventEmitter.emitWarningTransactionEvent(
      WarningTransactionEventType.CLOSED,
      controllerEvent,
    );
  }

  /**
   * Emit failure event.
   * @param event Data.
   */
  failedWarningTransaction(event: WarningTransactionEvent): void {
    const controllerEvent = new WarningTransactionControllerEvent({
      id: event.id,
      status: event.status,
    });

    this.eventEmitter.emitWarningTransactionEvent(
      WarningTransactionEventType.FAILED,
      controllerEvent,
    );
  }

  /**
   * Emit close warning transaction event.
   * @param event Data.
   */
  expiredWarningTransaction(event: WarningTransactionEvent): void {
    const controllerEvent = new WarningTransactionControllerEvent({
      id: event.id,
      status: event.status,
    });

    this.eventEmitter.emitWarningTransactionEvent(
      WarningTransactionEventType.EXPIRED,
      controllerEvent,
    );
  }
}
