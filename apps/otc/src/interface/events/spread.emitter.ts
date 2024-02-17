import { Spread } from '@zro/otc/domain';
import { SpreadEvent, SpreadEventEmitter } from '@zro/otc/application';

export enum SpreadEventType {
  CREATED = 'CREATED',
  DELETED = 'DELETED',
}

export interface SpreadEventEmitterControllerInterface {
  /**
   * Call quotations microservice to emit spreads event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitSpreadEvent: (eventName: SpreadEventType, event: SpreadEvent[]) => void;
}

export class SpreadEventEmitterController implements SpreadEventEmitter {
  constructor(private eventEmitter: SpreadEventEmitterControllerInterface) {}

  /**
   * Call quotations microservice to emit new spreads.
   * @param spreads Data.
   */
  createdSpreads(spreads: Spread[]): void {
    const event = spreads.map<SpreadEvent>((spread) => ({
      id: spread.id,
      currencySymbol: spread.currency.symbol,
      buy: spread.buy,
      sell: spread.sell,
      amount: spread.amount,
    }));

    this.eventEmitter.emitSpreadEvent(SpreadEventType.CREATED, event);
  }

  /**
   * Call quotations microservice to emit deleted spread.
   * @param spread Data.
   */
  deletedSpread(spread: Spread): void {
    const event: SpreadEvent[] = [
      {
        currencySymbol: spread.currency.symbol,
      },
    ];

    this.eventEmitter.emitSpreadEvent(SpreadEventType.DELETED, event);
  }
}
