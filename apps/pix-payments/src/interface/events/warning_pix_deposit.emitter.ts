import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import { WarningPixDepositState } from '@zro/pix-payments/domain';
import {
  WarningPixDepositEvent,
  WarningPixDepositEventEmitter,
} from '@zro/pix-payments/application';

export enum WarningPixDepositEventType {
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

type UserId = User['uuid'];

export type TWarningPixDepositControllerEvent = {
  userId?: UserId;
  amount?: number;
  thirdPartName?: string;
} & Pick<WarningPixDepositEvent, 'id' | 'state'>;

export class WarningPixDepositControllerEvent
  extends AutoValidator
  implements TWarningPixDepositControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsUUID(4)
  userId?: UserId;

  @IsEnum(WarningPixDepositState)
  state: WarningPixDepositState;

  @IsInt()
  @IsOptional()
  @IsPositive()
  amount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName?: string;

  constructor(props: TWarningPixDepositControllerEvent) {
    super(props);
  }
}

export interface WarningPixDepositEventEmitterControllerInterface {
  /**
   * Emit WarningPixDeposit event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitWarningPixDepositEvent: (
    eventName: WarningPixDepositEventType,
    event: WarningPixDepositControllerEvent,
  ) => void;
}

export class WarningPixDepositEventEmitterController
  implements WarningPixDepositEventEmitter
{
  constructor(
    private eventEmitter: WarningPixDepositEventEmitterControllerInterface,
  ) {}

  /**
   * Emit created event.
   * @param event Data.
   */
  createdWarningPixDeposit(event: WarningPixDepositEvent): void {
    const controllerEvent = new WarningPixDepositControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      amount: event.deposit.amount,
      thirdPartName: event.deposit.thirdPartName,
    });

    this.eventEmitter.emitWarningPixDepositEvent(
      WarningPixDepositEventType.CREATED,
      controllerEvent,
    );
  }

  /**
   * Emit approved event.
   * @param event Data.
   */
  approvedWarningPixDeposit(event: WarningPixDepositEvent): void {
    const controllerEvent = new WarningPixDepositControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitWarningPixDepositEvent(
      WarningPixDepositEventType.APPROVED,
      controllerEvent,
    );
  }

  /**
   * Emit rejected event.
   * @param event Data.
   */
  rejectedWarningPixDeposit(event: WarningPixDepositEvent): void {
    const controllerEvent = new WarningPixDepositControllerEvent({
      id: event.id,
      state: event.state,
    });

    this.eventEmitter.emitWarningPixDepositEvent(
      WarningPixDepositEventType.REJECTED,
      controllerEvent,
    );
  }
}
