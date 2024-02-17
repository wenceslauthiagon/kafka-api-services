import { IsInt, IsNumber, IsPositive, IsString, Min } from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  StreamQuotationEvent,
  StreamQuotationEventEmitter,
} from '@zro/quotations/application';
import { Currency } from '@zro/operations/domain';
import { StreamPair, StreamQuotation } from '@zro/quotations/domain';

export enum StreamQuotationEventType {
  CREATED = 'CREATED',
}

type TStreamQuotationControllerEvent = {
  quoteCurrencySymbol: Currency['symbol'];
  quoteCurrencyId: Currency['id'];
  quoteCurrencyDecimal: Currency['decimal'];
  baseCurrencySymbol: Currency['symbol'];
  baseCurrencyId: Currency['id'];
  baseCurrencyDecimal: Currency['decimal'];
  provider: StreamQuotation['gatewayName'];
  priceBuy: StreamQuotation['buy'];
  priceSell: StreamQuotation['sell'];
  price: number;
  priority: StreamPair['priority'];
};

export class StreamQuotationControllerEvent
  extends AutoValidator
  implements TStreamQuotationControllerEvent
{
  @IsString()
  quoteCurrencySymbol: Currency['symbol'];

  @IsInt()
  @IsPositive()
  quoteCurrencyId: Currency['id'];

  @IsInt()
  @Min(0)
  quoteCurrencyDecimal: Currency['decimal'];

  @IsString()
  baseCurrencySymbol: Currency['symbol'];

  @IsInt()
  @IsPositive()
  baseCurrencyId: Currency['id'];

  @IsInt()
  @Min(0)
  baseCurrencyDecimal: Currency['decimal'];

  @IsString()
  provider: StreamQuotation['gatewayName'];

  @IsInt()
  priority: StreamPair['priority'];

  @IsNumber()
  @IsPositive()
  price: StreamQuotation['buy'];

  @IsNumber()
  @IsPositive()
  priceBuy: StreamQuotation['buy'];

  @IsNumber()
  @IsPositive()
  priceSell: StreamQuotation['sell'];

  constructor(props: TStreamQuotationControllerEvent) {
    super(props);
  }
}

export interface StreamQuotationEventEmitterControllerInterface {
  /**
   * Call quotations microservice to emit streamQuotation.
   * @param eventName The event name.
   * @param event Data.
   */
  emitStreamQuotationEvent: (
    eventName: StreamQuotationEventType,
    event: StreamQuotationControllerEvent[],
  ) => void;
}

export class StreamQuotationEventEmitterController
  implements StreamQuotationEventEmitter
{
  constructor(
    private eventEmitter: StreamQuotationEventEmitterControllerInterface,
  ) {}

  /**
   * Emit create event.
   * @param event Data.
   */
  createStreamQuotation(events: StreamQuotationEvent[]): void {
    const controllerEvents = events.map(
      (event) =>
        new StreamQuotationControllerEvent({
          quoteCurrencySymbol: event.quoteCurrency.symbol,
          quoteCurrencyId: event.quoteCurrency.id,
          quoteCurrencyDecimal: event.quoteCurrency.decimal,
          baseCurrencySymbol: event.baseCurrency.symbol,
          baseCurrencyId: event.baseCurrency.id,
          baseCurrencyDecimal: event.baseCurrency.decimal,
          provider: event.gatewayName,
          priority: event.streamPair.priority,
          price: (event.buy + event.sell) / 2,
          priceBuy: event.buy,
          priceSell: event.sell,
        }),
    );

    this.eventEmitter.emitStreamQuotationEvent(
      StreamQuotationEventType.CREATED,
      controllerEvents,
    );
  }
}
