import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator, Failed } from '@zro/common';
import { User } from '@zro/users/domain';
import { Bank } from '@zro/banking/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import { PixDeposit, PixDevolutionState } from '@zro/pix-payments/domain';
import {
  PixDevolutionEvent,
  PixDevolutionEventEmitter,
} from '@zro/pix-payments/application';

export enum PixDevolutionEventType {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED',
  REVERTED = 'REVERTED',
  CREATE_FAILED = 'CREATE_FAILED',
  PENDING_FAILED = 'PENDING_FAILED',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type PixDepositId = PixDeposit['id'];
type OperationId = Operation['id'];
type BankIspb = Bank['ispb'];

type TPixDevolutionControllerEvent = {
  userId: UserId;
  walletId: WalletId;
  pixDepositId?: PixDepositId;
  operationId?: OperationId;
  thirdPartName?: PixDeposit['thirdPartName'];
  thirdPartDocument?: PixDeposit['thirdPartDocument'];
  thirdPartBranch?: PixDeposit['thirdPartBranch'];
  thirdPartAccountNumber?: PixDeposit['thirdPartAccountNumber'];
  thirdPartBankIspb?: BankIspb;
  clientName?: PixDeposit['clientName'];
  clientDocument?: PixDeposit['clientDocument'];
  clientBranch?: PixDeposit['clientBranch'];
  clientAccountNumber?: PixDeposit['clientAccountNumber'];
  transactionTag?: string;
} & Pick<
  PixDevolutionEvent,
  'id' | 'state' | 'endToEndId' | 'chargebackReason' | 'failed'
> &
  Partial<Pick<PixDevolutionEvent, 'amount'>>;

export class PixDevolutionControllerEvent
  extends AutoValidator
  implements TPixDevolutionControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

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

  @IsInt()
  @IsOptional()
  @IsPositive()
  amount?: number;

  @IsUUID(4)
  @IsOptional()
  pixDepositId?: PixDepositId;

  @IsUUID(4)
  @IsOptional()
  operationId?: OperationId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionTag?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName: string;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  thirdPartBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  thirdPartBankIspb?: BankIspb;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName?: string;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  clientDocument?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientAccountNumber?: string;

  constructor(props: TPixDevolutionControllerEvent) {
    super(props);
  }
}

export interface PixDevolutionEventEmitterControllerInterface {
  /**
   * Emit devolution event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDevolutionEvent: (
    eventName: PixDevolutionEventType,
    event: PixDevolutionControllerEvent,
  ) => void;
}

export class PixDevolutionEventEmitterController
  implements PixDevolutionEventEmitter
{
  constructor(
    private eventEmitter: PixDevolutionEventEmitterControllerInterface,
  ) {}

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      amount: event.amount,
      operationId: event.operation.id,
      transactionTag: event.transactionTag,
      thirdPartName: event.deposit?.thirdPartName,
      thirdPartDocument: event.deposit?.thirdPartDocument,
      thirdPartBranch: event.deposit?.thirdPartBranch,
      thirdPartBankIspb: event.deposit?.thirdPartBank?.ispb,
      thirdPartAccountNumber: event.deposit?.thirdPartAccountNumber,
      clientName: event.deposit?.clientName,
      clientDocument: event.deposit?.clientDocument,
      clientBranch: event.deposit?.clientBranch,
      clientAccountNumber: event.deposit?.clientAccountNumber,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.WAITING,
      controllerEvent,
    );
  }

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      amount: event.amount,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.FAILED,
      controllerEvent,
    );
  }

  /**
   * Emit canceled event.
   * @param event Data.
   */
  canceledDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.CANCELED,
      controllerEvent,
    );
  }

  /**
   * Emit error event.
   * @param event Data.
   */
  errorDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.ERROR,
      controllerEvent,
    );
  }

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      endToEndId: event.endToEndId,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.COMPLETED,
      controllerEvent,
    );
  }

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      chargebackReason: event.chargebackReason,
      failed: event.failed,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.REVERTED,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  createFailedPixDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.deposit?.user?.uuid,
      walletId: event.deposit?.wallet?.uuid,
      pixDepositId: event.deposit?.id,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.CREATE_FAILED,
      controllerEvent,
    );
  }

  pendingFailedPixDevolution(event: PixDevolutionEvent): void {
    const controllerEvent = new PixDevolutionControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitDevolutionEvent(
      PixDevolutionEventType.PENDING_FAILED,
      controllerEvent,
    );
  }
}
