import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { AdminBankingTedState } from '@zro/banking/domain';

import {
  AdminBankingTedEvent,
  AdminBankingTedEventEmitter,
} from '@zro/banking/application';

export enum AdminBankingTedEventType {
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  FORWARDED = 'FORWARDED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

type TAdminBankingTedControllerEvent = Pick<
  AdminBankingTedEvent,
  'id' | 'state'
>;

export class AdminBankingTedControllerEvent
  extends AutoValidator
  implements TAdminBankingTedControllerEvent
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  constructor(props: TAdminBankingTedControllerEvent) {
    super(props);
  }
}

export interface AdminBankingTedEventEmitterControllerInterface {
  /**
   * Call banks microservice to emit banking ted.
   * @param eventName The event name.
   * @param event Data.
   */
  emitAdminBankingTedEvent: (
    eventName: AdminBankingTedEventType,
    event: AdminBankingTedControllerEvent,
  ) => void;
}

export class AdminBankingTedEventEmitterController
  implements AdminBankingTedEventEmitter
{
  constructor(
    private eventEmitter: AdminBankingTedEventEmitterControllerInterface,
  ) {}

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  pendingAdminBankingTed(event: AdminBankingTedEvent): void {
    const controllerEvent = new AdminBankingTedControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitAdminBankingTedEvent(
      AdminBankingTedEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  waitingAdminBankingTed(event: AdminBankingTedEvent): void {
    const controllerEvent = new AdminBankingTedControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitAdminBankingTedEvent(
      AdminBankingTedEventType.WAITING,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  forwardedAdminBankingTed(event: AdminBankingTedEvent): void {
    const controllerEvent = new AdminBankingTedControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitAdminBankingTedEvent(
      AdminBankingTedEventType.FORWARDED,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  confirmedAdminBankingTed(event: AdminBankingTedEvent): void {
    const controllerEvent = new AdminBankingTedControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitAdminBankingTedEvent(
      AdminBankingTedEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit banking ted.
   * @param event Data.
   */
  failedAdminBankingTed(event: AdminBankingTedEvent): void {
    const controllerEvent = new AdminBankingTedControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitAdminBankingTedEvent(
      AdminBankingTedEventType.FAILED,
      controllerEvent,
    );
  }
}
