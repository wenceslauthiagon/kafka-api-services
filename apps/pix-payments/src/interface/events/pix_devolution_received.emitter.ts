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
import { PixDevolutionReceivedState } from '@zro/pix-payments/domain';
import {
  PixDevolutionReceivedEventEmitter,
  PixDevolutionReceivedEvent,
} from '@zro/pix-payments/application';

export enum PixDevolutionReceivedEventType {
  READY = 'READY',
  ERROR = 'ERROR',
}

type OperationId = Operation['id'];
type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type BankIspb = Bank['ispb'];

type TPixDevolutionReceivedControllerEvent = {
  userId: UserId;
  walletId: WalletId;
  operationId?: OperationId;
  thirdPartBankIspb?: BankIspb;
  refundOperationId?: OperationId;
} & Pick<PixDevolutionReceivedEvent, 'id' | 'state'> &
  Partial<
    Pick<
      PixDevolutionReceivedEvent,
      | 'amount'
      | 'transactionTag'
      | 'thirdPartName'
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

export class PixDevolutionReceivedControllerEvent
  extends AutoValidator
  implements TPixDevolutionReceivedControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsEnum(PixDevolutionReceivedState)
  state: PixDevolutionReceivedState;

  @IsInt()
  @IsOptional()
  @IsPositive()
  amount?: number;

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
  thirdPartName?: string;

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

  constructor(props: TPixDevolutionReceivedControllerEvent) {
    super(props);
  }
}

export interface PixDevolutionReceivedEventEmitterControllerInterface {
  /**
   * Emit devolution received event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitDevolutionReceivedEvent: (
    eventName: PixDevolutionReceivedEventType,
    event: PixDevolutionReceivedControllerEvent,
  ) => void;
}

export class PixDevolutionReceivedEventEmitterController
  implements PixDevolutionReceivedEventEmitter
{
  constructor(
    private eventEmitter: PixDevolutionReceivedEventEmitterControllerInterface,
  ) {}

  /**
   * Emit ready devolution received event.
   * @param event Data.
   */
  readyDevolutionReceived(event: PixDevolutionReceivedEvent): void {
    const controllerEvent = new PixDevolutionReceivedControllerEvent({
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

    this.eventEmitter.emitDevolutionReceivedEvent(
      PixDevolutionReceivedEventType.READY,
      controllerEvent,
    );
  }

  /**
   * Emit error devolution received event.
   * @param event Data.
   */
  errorDevolutionReceived(event: PixDevolutionReceivedEvent): void {
    const controllerEvent = new PixDevolutionReceivedControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitDevolutionReceivedEvent(
      PixDevolutionReceivedEventType.ERROR,
      controllerEvent,
    );
  }
}
