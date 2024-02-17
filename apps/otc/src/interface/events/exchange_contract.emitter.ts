import {
  ExchangeContractEvent,
  ExchangeContractEventEmitter,
} from '@zro/otc/application';
import { ExchangeContract } from '@zro/otc/domain';

export enum ExchangeContractEventType {
  CREATED = 'CREATED',
}

export interface ExchangeContractEventEmitterControllerInterface {
  /**
   * Call otc microservice to emit exchange contract.
   * @param eventName The event name.
   * @param event Data.
   */
  emitExchangeContractEvent: <T extends ExchangeContractEvent>(
    eventName: ExchangeContractEventType,
    event: T,
  ) => void;
}

export class ExchangeContractEventEmitterController
  implements ExchangeContractEventEmitter
{
  constructor(
    private eventEmitter: ExchangeContractEventEmitterControllerInterface,
  ) {}

  created(exchangeContract: ExchangeContract): void {
    const event: ExchangeContractEvent = {
      id: exchangeContract.id,
    };

    this.eventEmitter.emitExchangeContractEvent(
      ExchangeContractEventType.CREATED,
      event,
    );
  }
}
