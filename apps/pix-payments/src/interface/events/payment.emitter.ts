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
import { AutoValidator, Failed, IsCpfOrCnpj } from '@zro/common';
import { User } from '@zro/users/domain';
import { Operation, Wallet } from '@zro/operations/domain';
import { PaymentState } from '@zro/pix-payments/domain';
import {
  PaymentEvent,
  PaymentEventEmitter,
} from '@zro/pix-payments/application';

export enum PaymentEventType {
  SCHEDULED = 'SCHEDULED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED',
  REVERTED = 'REVERTED',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TPaymentControllerEvent = {
  userId: UserId;
  walletId: WalletId;
  operationId?: OperationId;
} & Pick<
  PaymentEvent,
  | 'id'
  | 'state'
  | 'endToEndId'
  | 'chargebackReason'
  | 'failed'
  | 'beneficiaryName'
> &
  Partial<
    Pick<
      PaymentEvent,
      | 'value'
      | 'transactionTag'
      | 'beneficiaryDocument'
      | 'beneficiaryBankIspb'
      | 'beneficiaryBranch'
      | 'beneficiaryAccountNumber'
      | 'ownerFullName'
      | 'ownerDocument'
      | 'ownerBranch'
      | 'ownerAccountNumber'
    >
  >;

export class PaymentControllerEvent
  extends AutoValidator
  implements TPaymentControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  walletId: WalletId;

  @IsEnum(PaymentState)
  state: PaymentState;

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
  value?: number;

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
  beneficiaryName?: string;

  @IsOptional()
  @IsCpfOrCnpj()
  beneficiaryDocument: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiaryBankIspb?: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  beneficiaryBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiaryAccountNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerFullName?: string;

  @IsOptional()
  @IsCpfOrCnpj()
  ownerDocument?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerBranch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerAccountNumber?: string;

  constructor(props: TPaymentControllerEvent) {
    super(props);
  }
}

export interface PaymentEventEmitterControllerInterface {
  /**
   * Emit payment event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitPaymentEvent: (
    eventName: PaymentEventType,
    event: PaymentControllerEvent,
  ) => void;
}

export class PaymentEventEmitterController implements PaymentEventEmitter {
  constructor(private eventEmitter: PaymentEventEmitterControllerInterface) {}

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitPaymentEvent(
      PaymentEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit scheduled event.
   * @param event Data.
   */
  scheduledPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      beneficiaryName: event.beneficiaryName,
      value: event.value,
    });

    this.eventEmitter.emitPaymentEvent(
      PaymentEventType.SCHEDULED,
      controllerEvent,
    );
  }

  /**
   * Emit confirmed event.
   * @param event Data.
   */
  confirmedPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      value: event.value,
      operationId: event.operation.id,
      transactionTag: event.transactionTag,
      beneficiaryName: event.beneficiaryName,
      beneficiaryDocument: event.beneficiaryDocument,
      beneficiaryBankIspb: event.beneficiaryBankIspb,
      beneficiaryBranch: event.beneficiaryBranch,
      beneficiaryAccountNumber: event.beneficiaryAccountNumber,
      ownerFullName: event.ownerFullName,
      ownerDocument: event.ownerDocument,
      ownerBranch: event.ownerBranch,
      ownerAccountNumber: event.ownerAccountNumber,
    });

    this.eventEmitter.emitPaymentEvent(
      PaymentEventType.CONFIRMED,
      controllerEvent,
    );
  }

  /**
   * Emit waiting event.
   * @param event Data.
   */
  waitingPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitPaymentEvent(
      PaymentEventType.WAITING,
      controllerEvent,
    );
  }

  /**
   * Emit failed event.
   * @param event Data.
   */
  failedPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      beneficiaryName: event.beneficiaryName,
      value: event.value,
    });

    this.eventEmitter.emitPaymentEvent(
      PaymentEventType.FAILED,
      controllerEvent,
    );
  }

  /**
   * Emit canceled event.
   * @param event Data.
   */
  canceledPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      beneficiaryName: event.beneficiaryName,
      value: event.value,
    });

    this.eventEmitter.emitPaymentEvent(
      PaymentEventType.CANCELED,
      controllerEvent,
    );
  }

  /**
   * Emit error event.
   * @param event Data.
   */
  errorPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      beneficiaryName: event.beneficiaryName,
      value: event.value,
    });

    this.eventEmitter.emitPaymentEvent(PaymentEventType.ERROR, controllerEvent);
  }

  /**
   * Emit completed event.
   * @param event Data.
   */
  completedPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      endToEndId: event.endToEndId,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
    });

    this.eventEmitter.emitPaymentEvent(
      PaymentEventType.COMPLETED,
      controllerEvent,
    );
  }

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedPayment(event: PaymentEvent): void {
    const controllerEvent = new PaymentControllerEvent({
      id: event.id,
      state: event.state,
      userId: event.user.uuid,
      walletId: event.wallet.uuid,
      chargebackReason: event.chargebackReason,
      failed: event.failed,
    });

    this.eventEmitter.emitPaymentEvent(
      PaymentEventType.REVERTED,
      controllerEvent,
    );
  }
}
