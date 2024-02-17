import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  ExchangeQuotationEvent,
  ExchangeQuotationEventEmitter,
} from '@zro/otc/application';
import { Provider, System } from '@zro/otc/domain';

export enum ExchangeQuotationEventType {
  READY = 'READY',
  ACCEPT = 'ACCEPT',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
}

type TExchangeQuotationControllerEvent = ExchangeQuotationEvent;

export class ExchangeQuotationControllerEvent
  extends AutoValidator
  implements TExchangeQuotationControllerEvent
{
  @IsDate()
  @IsOptional()
  sendDate?: Date;

  @IsDate()
  @IsOptional()
  receiveDate?: Date;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  @IsOptional()
  remittanceIds?: string[];

  @IsUUID(4)
  @IsOptional()
  providerId?: Provider['id'];

  @IsUUID(4)
  @IsOptional()
  systemId?: System['id'];

  @IsString()
  @IsOptional()
  currencyTag?: string;

  @IsUUID(4)
  @IsOptional()
  solicitationPspId?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  quotationPspId?: string;

  constructor(props: TExchangeQuotationControllerEvent) {
    super(props);
  }
}

export interface ExchangeQuotationEventEmitterControllerInterface {
  /**
   * Emit exchange quotation event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitExchangeQuotationEvent: (
    eventName: ExchangeQuotationEventType,
    event: ExchangeQuotationControllerEvent,
  ) => void;
}

export class ExchangeQuotationEventEmitterController
  implements ExchangeQuotationEventEmitter
{
  constructor(
    private eventEmitter: ExchangeQuotationEventEmitterControllerInterface,
  ) {}

  /**
   * Emit ready event.
   * @param event Data.
   */
  readyExchangeQuotation(event: ExchangeQuotationEvent): void {
    const controllerEvent = new ExchangeQuotationControllerEvent({
      sendDate: event.sendDate,
      receiveDate: event.receiveDate,
      remittanceIds: event.remittanceIds,
      currencyTag: event.currencyTag,
      providerId: event.providerId,
      systemId: event.systemId,
    });

    this.eventEmitter.emitExchangeQuotationEvent(
      ExchangeQuotationEventType.READY,
      controllerEvent,
    );
  }

  /**
   * Emit accept event.
   * @param event Data.
   */
  acceptExchangeQuotation(event: ExchangeQuotationEvent): void {
    const controllerEvent = new ExchangeQuotationControllerEvent({
      solicitationPspId: event.solicitationPspId,
      quotationPspId: event.quotationPspId,
    });

    this.eventEmitter.emitExchangeQuotationEvent(
      ExchangeQuotationEventType.ACCEPT,
      controllerEvent,
    );
  }

  /**
   * Emit approved event.
   * @param event Data.
   */
  approvedExchangeQuotation(event: ExchangeQuotationEvent): void {
    const controllerEvent = new ExchangeQuotationControllerEvent({
      solicitationPspId: event.solicitationPspId,
      quotationPspId: event.quotationPspId,
    });

    this.eventEmitter.emitExchangeQuotationEvent(
      ExchangeQuotationEventType.APPROVED,
      controllerEvent,
    );
  }

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedExchangeQuotation(event: ExchangeQuotationEvent): void {
    const controllerEvent = new ExchangeQuotationControllerEvent({
      solicitationPspId: event.solicitationPspId,
      quotationPspId: event.quotationPspId,
    });

    this.eventEmitter.emitExchangeQuotationEvent(
      ExchangeQuotationEventType.COMPLETED,
      controllerEvent,
    );
  }

  /**
   * Emit rejected event.
   * @param event Data.
   */
  rejectedExchangeQuotation(event: ExchangeQuotationEvent): void {
    const controllerEvent = new ExchangeQuotationControllerEvent({
      solicitationPspId: event.solicitationPspId,
      quotationPspId: event.quotationPspId,
    });

    this.eventEmitter.emitExchangeQuotationEvent(
      ExchangeQuotationEventType.REJECTED,
      controllerEvent,
    );
  }

  /**
   * Emit canceled event.
   * @param event Data.
   */
  canceledExchangeQuotation(event: ExchangeQuotationEvent): void {
    const controllerEvent = new ExchangeQuotationControllerEvent({
      solicitationPspId: event.solicitationPspId,
      quotationPspId: event.quotationPspId,
    });

    this.eventEmitter.emitExchangeQuotationEvent(
      ExchangeQuotationEventType.CANCELED,
      controllerEvent,
    );
  }
}
