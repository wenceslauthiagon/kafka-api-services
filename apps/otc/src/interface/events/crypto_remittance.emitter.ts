import {
  IsDate,
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  CryptoRemittanceEvent,
  CryptoRemittanceEventEmitter,
} from '@zro/otc/application';
import {
  CryptoMarket,
  CryptoRemittanceStatus,
  OrderSide,
  OrderType,
  Provider,
  System,
} from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';

export enum CryptoRemittanceEventType {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  WAITING = 'WAITING',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
}

type SystemName = System['name'];

type TCryptoRemittanceControllerEvent = {
  systemName?: SystemName;
} & CryptoRemittanceEvent;

export class CryptoRemittanceControllerEvent
  extends AutoValidator
  implements TCryptoRemittanceControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsDefined()
  baseCurrency: Currency;

  @IsDefined()
  quoteCurrency: Currency;

  @IsDefined()
  market: CryptoMarket;

  @IsPositive()
  amount: number;

  @IsEnum(OrderType)
  type: OrderType;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  stopPrice?: number;

  @IsOptional()
  @IsDate()
  validUntil?: Date;

  @IsOptional()
  @IsUUID(4)
  providerOrderId?: string;

  @IsOptional()
  @IsDefined()
  provider?: Provider;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsNumber()
  executedPrice?: number;

  @IsOptional()
  @IsNumber()
  executedAmount?: number;

  @IsOptional()
  @IsNumber()
  fee?: number;

  @IsEnum(CryptoRemittanceStatus)
  status: CryptoRemittanceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  systemName: SystemName;

  constructor(props: TCryptoRemittanceControllerEvent) {
    super(props);
  }
}

export interface CryptoRemittanceEventEmitterControllerInterface {
  /**
   * Emit cryptoOrder event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitCryptoRemittanceEvent: (
    eventName: CryptoRemittanceEventType,
    event: CryptoRemittanceControllerEvent,
  ) => void;
}

export class CryptoRemittanceEventEmitterController
  implements CryptoRemittanceEventEmitter
{
  constructor(
    private eventEmitter: CryptoRemittanceEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingCryptoRemittance(event: CryptoRemittanceEvent): void {
    const controllerEvent = new CryptoRemittanceControllerEvent({
      ...event,
    });

    this.eventEmitter.emitCryptoRemittanceEvent(
      CryptoRemittanceEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  filledCryptoRemittance(event: CryptoRemittanceEvent): void {
    const controllerEvent = new CryptoRemittanceControllerEvent({
      ...event,
    });

    this.eventEmitter.emitCryptoRemittanceEvent(
      CryptoRemittanceEventType.FILLED,
      controllerEvent,
    );
  }

  /**
   * Emit failed event.
   * @param event Data.
   */
  waitingCryptoRemittance(event: CryptoRemittanceEvent): void {
    const controllerEvent = new CryptoRemittanceControllerEvent({
      ...event,
    });

    this.eventEmitter.emitCryptoRemittanceEvent(
      CryptoRemittanceEventType.WAITING,
      controllerEvent,
    );
  }

  canceledCryptoRemittance(event: CryptoRemittanceEvent): void {
    const controllerEvent = new CryptoRemittanceControllerEvent({
      ...event,
    });

    this.eventEmitter.emitCryptoRemittanceEvent(
      CryptoRemittanceEventType.CANCELED,
      controllerEvent,
    );
  }

  /**
   * Emit error event.
   * @param event Data.
   */
  errorCryptoRemittance(event: CryptoRemittanceEvent): void {
    const controllerEvent = new CryptoRemittanceControllerEvent({
      ...event,
    });

    this.eventEmitter.emitCryptoRemittanceEvent(
      CryptoRemittanceEventType.ERROR,
      controllerEvent,
    );
  }
}
