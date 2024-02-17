import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import { Bank } from '@zro/banking/domain';
import { Wallet, Operation } from '@zro/operations/domain';
import { PixDepositState } from '@zro/pix-payments/domain';
import {
  PixDepositEvent,
  PixDepositEventEmitter,
} from '@zro/pix-payments/application';

export enum PixDepositEventType {
  NEW = 'NEW',
  RECEIVED = 'RECEIVED',
  WAITING = 'WAITING',
  BLOCKED = 'BLOCKED',
  RECEIVED_FAILED = 'RECEIVED_FAILED',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];
type BankIspb = Bank['ispb'];

type TPixDepositControllerEvent = {
  userId: UserId;
  walletId: WalletId;
  operationId?: OperationId;
  thirdPartBankIspb?: BankIspb;
  refundOperationId?: OperationId;
} & Pick<PixDepositEvent, 'id' | 'state' | 'amount' | 'thirdPartName'> &
  Partial<
    Pick<
      PixDepositEvent,
      | 'transactionTag'
      | 'thirdPartDocument'
      | 'thirdPartBranch'
      | 'thirdPartAccountNumber'
      | 'thirdPartBank'
      | 'clientName'
      | 'clientDocument'
      | 'clientBranch'
      | 'clientAccountNumber'
    >
  >;

export class PixDepositControllerEvent
  extends AutoValidator
  implements TPixDepositControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsEnum(PixDepositState)
  state: PixDepositState;

  @IsInt()
  @IsOptional()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName: string;

  @IsUUID(4)
  @IsOptional()
  operationId?: OperationId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionTag?: string;

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

  @IsOptional()
  @IsUUID(4)
  refundOperationId?: OperationId;

  constructor(props: TPixDepositControllerEvent) {
    super(props);
  }
}

export interface PixDepositEventEmitterControllerInterface {
  /**
   * Emit deposit event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDepositEvent: (
    eventName: PixDepositEventType,
    event: PixDepositControllerEvent,
  ) => void;
}

export class PixDepositEventEmitterController
  implements PixDepositEventEmitter
{
  constructor(
    private eventEmitter: PixDepositEventEmitterControllerInterface,
  ) {}

  /**
   * Emit received event.
   * @param event Data.
   */
  receivedDeposit(event: PixDepositEvent): void {
    const controllerEvent = new PixDepositControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      amount: event.amount,
      operationId: event.operation.id,
      transactionTag: event.transactionTag,
      thirdPartName: event.thirdPartName,
      thirdPartDocument: event.thirdPartDocument,
      thirdPartBranch: event.thirdPartBranch,
      thirdPartBankIspb: event.thirdPartBank?.ispb,
      thirdPartAccountNumber: event.thirdPartAccountNumber,
      clientName: event.clientName,
      clientDocument: event.clientDocument,
      clientBranch: event.clientBranch,
      clientAccountNumber: event.clientAccountNumber,
      refundOperationId: event.refundOperationId,
    });

    this.eventEmitter.emitDepositEvent(
      PixDepositEventType.RECEIVED,
      controllerEvent,
    );
  }

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingDeposit(event: PixDepositEvent): void {
    const controllerEvent = new PixDepositControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      amount: event.amount,
      thirdPartName: event.thirdPartName,
    });

    this.eventEmitter.emitDepositEvent(
      PixDepositEventType.WAITING,
      controllerEvent,
    );
  }

  /**
   * Emit blocked event.
   * @param event Data.
   */
  blockedDeposit(event: PixDepositEvent): void {
    const controllerEvent = new PixDepositControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      amount: event.amount,
      thirdPartName: event.thirdPartName,
    });

    this.eventEmitter.emitDepositEvent(
      PixDepositEventType.BLOCKED,
      controllerEvent,
    );
  }

  /**
   * Emit new event.
   * @param event Data.
   */
  newDeposit(event: PixDepositEvent): void {
    const controllerEvent = new PixDepositControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      amount: event.amount,
      thirdPartName: event.thirdPartName,
    });

    this.eventEmitter.emitDepositEvent(
      PixDepositEventType.NEW,
      controllerEvent,
    );
  }

  /**
   * Emit received failed event.
   * @param event Data.
   */
  receivedFailedDeposit(event: PixDepositEvent): void {
    const controllerEvent = new PixDepositControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      amount: event.amount,
      thirdPartName: event.thirdPartName,
    });

    this.eventEmitter.emitDepositEvent(
      PixDepositEventType.RECEIVED_FAILED,
      controllerEvent,
    );
  }
}
