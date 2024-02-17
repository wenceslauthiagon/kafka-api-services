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
import {
  WarningPixDeposit,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionEvent,
  WarningPixDevolutionEventEmitter,
} from '@zro/pix-payments/application';

export enum WarningPixDevolutionEventType {
  CREATED = 'CREATED',
  COMPLETED = 'COMPLETED',
  REVERTED = 'REVERTED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  WAITING = 'WAITING',
  CONFIRMED = 'CONFIRMED',
}

type UserId = User['uuid'];
type WarningPixId = WarningPixDeposit['id'];

type TWarningPixDevolutionControllerEvent = {
  userId?: string;
  warningPixId?: WarningPixId;
} & Pick<WarningPixDevolutionEvent, 'id' | 'state' | 'failed' | 'endToEndId'>;

export class WarningPixDevolutionControllerEvent
  extends AutoValidator
  implements TWarningPixDevolutionControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsEnum(WarningPixDevolutionState)
  state: WarningPixDevolutionState;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  @IsOptional()
  @IsUUID(4)
  warningPixId: WarningPixId;

  constructor(props: TWarningPixDevolutionControllerEvent) {
    super(props);
  }
}

export interface WarningPixDevolutionEventEmitterControllerInterface {
  /**
   * Emit devolution event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDevolutionEvent: (
    eventName: WarningPixDevolutionEventType,
    event: WarningPixDevolutionControllerEvent,
  ) => void;
}

export class WarningPixDevolutionEventEmitterController
  implements WarningPixDevolutionEventEmitter
{
  constructor(
    private eventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
  ) {}
  /**
   * Emit completed event.
   * @param event Data.
   */
  completedWarningPixDevolution(event: WarningPixDevolutionEvent): void {
    const controllerEvent = new WarningPixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      endToEndId: event.endToEndId,
    });

    this.eventEmitter.emitDevolutionEvent(
      WarningPixDevolutionEventType.COMPLETED,
      controllerEvent,
    );
  }

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedWarningPixDevolution(event: WarningPixDevolutionEvent): void {
    const controllerEvent = new WarningPixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      failed: event.failed,
    });

    this.eventEmitter.emitDevolutionEvent(
      WarningPixDevolutionEventType.REVERTED,
      controllerEvent,
    );
  }

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingWarningPixDevolution(event: WarningPixDevolutionEvent): void {
    const controllerEvent = new WarningPixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      WarningPixDevolutionEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedWarningPixDevolution(event: WarningPixDevolutionEvent): void {
    const controllerEvent = new WarningPixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      WarningPixDevolutionEventType.FAILED,
      controllerEvent,
    );
  }

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingWarningPixDevolution(event: WarningPixDevolutionEvent): void {
    const controllerEvent = new WarningPixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      WarningPixDevolutionEventType.WAITING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedWarningPixDevolution(event: WarningPixDevolutionEvent): void {
    const controllerEvent = new WarningPixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      WarningPixDevolutionEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit create event.
   * @param event Data.
   */
  createWarningPixDevolution(event: WarningPixDevolutionEvent): void {
    const controllerEvent = new WarningPixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.warningPixDeposit?.user?.uuid,
      warningPixId: event.warningPixDeposit.id,
    });

    this.eventEmitter.emitDevolutionEvent(
      WarningPixDevolutionEventType.CREATED,
      controllerEvent,
    );
  }
}
