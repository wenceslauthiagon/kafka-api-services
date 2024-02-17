import {
  IsUUID,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  IsPositive,
  IsString,
  MaxLength,
  Length,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  PixInfraction,
  PixRefundReason,
  PixRefundState,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  PixRefundEvent,
  PixRefundEventEmitter,
} from '@zro/pix-payments/application';
import { Bank } from '@zro/banking/domain';

export enum PixRefundEventType {
  RECEIVE_PENDING = 'RECEIVE_PENDING',
  RECEIVE_CONFIRMED = 'RECEIVE_CONFIRMED',
  CANCEL_PENDING = 'CANCEL_PENDING',
  CANCEL_CONFIRMED = 'CANCEL_CONFIRMED',
  CLOSED_PENDING = 'CLOSED_PENDING',
  CLOSED_CONFIRMED = 'CLOSED_CONFIRMED',
  CLOSED_WAITING = 'CLOSED_WAITING',
  ERROR = 'ERROR',
  RECEIVE = 'RECEIVE',
}

type InfractionId = PixInfraction['infractionPspId'];
type BankIspb = Bank['ispb'];

type TPixRefundControllerEvent = {
  error?: string;
} & Pick<
  PixRefundEvent,
  | 'id'
  | 'state'
  | 'contested'
  | 'amount'
  | 'description'
  | 'reason'
  | 'status'
  | 'solicitationPspId'
  | 'endToEndIdTransaction'
  | 'infractionId'
  | 'requesterIspb'
  | 'responderIspb'
>;

export class PixRefundControllerEvent
  extends AutoValidator
  implements TPixRefundControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsEnum(PixRefundState)
  state?: PixRefundState;

  @IsOptional()
  @IsUUID(4)
  solicitationPspId?: string;

  @IsOptional()
  @IsBoolean()
  contested?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1900)
  description?: string;

  @IsOptional()
  @IsEnum(PixRefundReason)
  reason?: PixRefundReason;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  requesterIspb?: BankIspb;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  responderIspb?: BankIspb;

  @IsOptional()
  @IsEnum(PixRefundStatus)
  status?: PixRefundStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsOptional()
  endToEndIdTransaction?: string;

  @IsOptional()
  @IsUUID(4)
  infractionId?: InfractionId;

  constructor(props: TPixRefundControllerEvent) {
    super(props);
  }
}

export interface PixRefundEventEmitterControllerInterface {
  /**
   * Emit pix refund event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitPixRefundEvent(
    eventName: PixRefundEventType,
    event: PixRefundControllerEvent,
  ): void;
}

export class PixRefundEventEmitterController implements PixRefundEventEmitter {
  constructor(private eventEmitter: PixRefundEventEmitterControllerInterface) {}

  /**
   * Emit pending pix refund event.
   * @param event Data.
   */
  receivePendingPixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.RECEIVE_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed pix refund event.
   * @param event Data.
   */
  receiveConfirmedPixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.RECEIVE_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit pending pix refund event.
   * @param event Data.
   */
  closePendingPixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.CLOSED_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit waiting pix refund event.
   * @param event Data.
   */
  closeWaitingPixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.CLOSED_WAITING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed pix refund event.
   * @param event Data.
   */
  closeConfirmedPixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.CLOSED_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit pending pix refund event.
   * @param event Data.
   */
  cancelPendingPixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.CANCEL_PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed pix refund event.
   * @param event Data.
   */
  cancelConfirmedPixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.CANCEL_CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit error event.
   * @param event Data.
   */
  errorPixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.ERROR,
      controllerEvent,
    );
  }

  /**
   * Emit receive pix refund event.
   * @param event Data.
   */
  receivePixRefund(event: PixRefundEvent): void {
    const controllerEvent = new PixRefundControllerEvent({
      id: event.id,
      solicitationPspId: event.solicitationPspId,
      contested: event.contested,
      amount: event.amount,
      description: event.description,
      reason: event.reason,
      requesterIspb: event.requesterIspb,
      responderIspb: event.responderIspb,
      status: event.status,
      endToEndIdTransaction: event.endToEndIdTransaction,
      infractionId: event.infractionId,
    });

    this.eventEmitter.emitPixRefundEvent(
      PixRefundEventType.RECEIVE,
      controllerEvent,
    );
  }
}
