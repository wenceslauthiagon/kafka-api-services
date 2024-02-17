import { IsString, IsUUID, Length } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { BankEvent, BankEventEmitter } from '@zro/banking/application';

export enum BankEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

type TBankControllerEvent = BankEvent;

export class BankControllerEvent
  extends AutoValidator
  implements TBankControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsString()
  @Length(8, 8)
  ispb: string;

  constructor(props: TBankControllerEvent) {
    super(props);
  }
}

export interface BankEventEmitterControllerInterface {
  /**
   * Call banks microservice to emit bank.
   * @param eventName The event name.
   * @param event Data.
   */
  emitBankEvent: (eventName: BankEventType, event: BankControllerEvent) => void;
}

export class BankEventEmitterController implements BankEventEmitter {
  constructor(private eventEmitter: BankEventEmitterControllerInterface) {}

  /**
   * Call banks microservice to emit bank.
   * @param event Data.
   */
  createdBank(event: BankEvent): void {
    const controllerEvent = new BankControllerEvent({
      id: event.id,
      ispb: event.ispb,
    });

    this.eventEmitter.emitBankEvent(BankEventType.CREATED, controllerEvent);
  }

  /**
   * Call banks microservice to emit bank.
   * @param event Data.
   */
  updatedBank(event: BankEvent): void {
    const controllerEvent = new BankControllerEvent({
      id: event.id,
      ispb: event.ispb,
    });

    this.eventEmitter.emitBankEvent(BankEventType.UPDATED, controllerEvent);
  }

  /**
   * Call banks microservice to emit bank.
   * @param event Data.
   */
  deletedBank(event: BankEvent): void {
    const controllerEvent = new BankControllerEvent({
      id: event.id,
      ispb: event.ispb,
    });

    this.eventEmitter.emitBankEvent(BankEventType.DELETED, controllerEvent);
  }
}
