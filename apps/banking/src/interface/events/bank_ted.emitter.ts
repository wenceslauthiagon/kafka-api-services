import { IsString, IsUUID, MaxLength } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { BankTedEvent, BankTedEventEmitter } from '@zro/banking/application';

export enum BankTedEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

type TBankTedControllerEvent = BankTedEvent;

export class BankTedControllerEvent
  extends AutoValidator
  implements TBankTedControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  code: string;

  constructor(props: TBankTedControllerEvent) {
    super(props);
  }
}

export interface BankTedEventEmitterControllerInterface {
  /**
   * Call banks microservice to emit bank.
   * @param eventName The event name.
   * @param event Data.
   */
  emitBankTedEvent: (
    eventName: BankTedEventType,
    event: BankTedControllerEvent,
  ) => void;
}

export class BankTedEventEmitterController implements BankTedEventEmitter {
  constructor(private eventEmitter: BankTedEventEmitterControllerInterface) {}

  /**
   * Call banks microservice to emit bank.
   * @param event Data.
   */
  createdBankTed(event: BankTedEvent): void {
    const controllerEvent = new BankTedControllerEvent({
      id: event.id,
      code: event.code,
    });

    this.eventEmitter.emitBankTedEvent(
      BankTedEventType.CREATED,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit bank.
   * @param event Data.
   */
  updatedBankTed(event: BankTedEvent): void {
    const controllerEvent = new BankTedControllerEvent({
      id: event.id,
      code: event.code,
    });

    this.eventEmitter.emitBankTedEvent(
      BankTedEventType.UPDATED,
      controllerEvent,
    );
  }

  /**
   * Call banks microservice to emit bank.
   * @param event Data.
   */
  deletedBankTed(event: BankTedEvent): void {
    const controllerEvent = new BankTedControllerEvent({
      id: event.id,
      code: event.code,
    });

    this.eventEmitter.emitBankTedEvent(
      BankTedEventType.DELETED,
      controllerEvent,
    );
  }
}
