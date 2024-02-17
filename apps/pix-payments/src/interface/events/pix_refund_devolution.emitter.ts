import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixRefund, PixRefundDevolutionState } from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionEvent,
  PixRefundDevolutionEventEmitter,
} from '@zro/pix-payments/application';

export enum PixRefundDevolutionEventType {
  CREATED = 'CREATED',
  COMPLETED = 'COMPLETED',
  REVERTED = 'REVERTED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  WAITING = 'WAITING',
  CONFIRMED = 'CONFIRMED',
}

type UserId = User['uuid'];
type PixRefundId = PixRefund['id'];

type TPixRefundDevolutionControllerEvent = {
  userId?: string;
  refundId?: PixRefundId;
} & Pick<
  PixRefundDevolutionEvent,
  'id' | 'state' | 'failed' | 'chargebackReason' | 'endToEndId'
>;

export class PixRefundDevolutionControllerEvent
  extends AutoValidator
  implements TPixRefundDevolutionControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsEnum(PixRefundDevolutionState)
  state: PixRefundDevolutionState;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  chargebackReason?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  @IsOptional()
  @IsUUID(4)
  refundId: PixRefundId;

  constructor(props: TPixRefundDevolutionControllerEvent) {
    super(props);
  }
}

export interface PixRefundDevolutionEventEmitterControllerInterface {
  /**
   * Emit devolution event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDevolutionEvent: (
    eventName: PixRefundDevolutionEventType,
    event: PixRefundDevolutionControllerEvent,
  ) => void;
}

export class PixRefundDevolutionEventEmitterController
  implements PixRefundDevolutionEventEmitter
{
  constructor(
    private eventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
  ) {}
  /**
   * Emit completed event.
   * @param event Data.
   */
  completedRefundDevolution(event: PixRefundDevolutionEvent): void {
    const controllerEvent = new PixRefundDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      endToEndId: event.endToEndId,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixRefundDevolutionEventType.COMPLETED,
      controllerEvent,
    );
  }

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedRefundDevolution(event: PixRefundDevolutionEvent): void {
    const controllerEvent = new PixRefundDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      failed: event.failed,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixRefundDevolutionEventType.REVERTED,
      controllerEvent,
    );
  }

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingRefundDevolution(event: PixRefundDevolutionEvent): void {
    const controllerEvent = new PixRefundDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixRefundDevolutionEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedRefundDevolution(event: PixRefundDevolutionEvent): void {
    const controllerEvent = new PixRefundDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixRefundDevolutionEventType.FAILED,
      controllerEvent,
    );
  }

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingRefundDevolution(event: PixRefundDevolutionEvent): void {
    const controllerEvent = new PixRefundDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixRefundDevolutionEventType.WAITING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedRefundDevolution(event: PixRefundDevolutionEvent): void {
    const controllerEvent = new PixRefundDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixRefundDevolutionEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit create event.
   * @param event Data.
   */
  createRefundDevolution(event: PixRefundDevolutionEvent): void {
    const controllerEvent = new PixRefundDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      refundId: event.pixRefund.id,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixRefundDevolutionEventType.CREATED,
      controllerEvent,
    );
  }
}
