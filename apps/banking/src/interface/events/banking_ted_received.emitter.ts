import { IsInt, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  BankingTedReceivedEvent,
  BankingTedReceivedEventEmitter,
} from '@zro/banking/application';
import { Operation } from '@zro/operations/domain';

export enum BankingTedReceivedEventType {
  RECEIVED = 'RECEIVED',
}

type OperationId = Operation['id'];

type TBankingTedReceivedControllerEvent = { operationId: OperationId } & Pick<
  BankingTedReceivedEvent,
  'id'
>;

export class BankingTedReceivedControllerEvent
  extends AutoValidator
  implements TBankingTedReceivedControllerEvent
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TBankingTedReceivedControllerEvent) {
    super(props);
  }
}

export interface BankingTedReceivedEventEmitterControllerInterface {
  /**
   * Call banks microservice to emit banking ted received.
   * @param eventName The event name.
   * @param event Data.
   */
  emitBankingTedReceivedEvent: (
    eventName: BankingTedReceivedEventType,
    event: BankingTedReceivedControllerEvent,
  ) => void;
}

export class BankingTedReceivedEventEmitterController
  implements BankingTedReceivedEventEmitter
{
  constructor(
    private eventEmitter: BankingTedReceivedEventEmitterControllerInterface,
  ) {}

  /**
   * Call banks microservice to emit banking ted received.
   * @param event Data.
   */
  receivedBankingTed(event: BankingTedReceivedEvent): void {
    const controllerEvent = new BankingTedReceivedControllerEvent({
      id: event.id,
      operationId: event.operation.id,
    });

    this.eventEmitter.emitBankingTedReceivedEvent(
      BankingTedReceivedEventType.RECEIVED,
      controllerEvent,
    );
  }
}
