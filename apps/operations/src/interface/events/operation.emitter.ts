import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Currency,
  Operation,
  OperationAnalysisTag,
  OperationState,
  TransactionType,
  UserLimitTracker,
  WalletAccount,
} from '@zro/operations/domain';
import {
  OperationEvent,
  OperationItemEvent,
  OperationEventEmitter,
} from '@zro/operations/application';

export enum OperationEventType {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVERTED = 'REVERTED',
}

type UserId = User['id'];
type CurrencyId = Currency['id'];
type OperationRefId = Operation['id'];
type WalletAccountId = WalletAccount['id'];
type TransactionTypeId = TransactionType['id'];
type TransactionTypeTag = TransactionType['tag'];
type UserLimitTrackerId = UserLimitTracker['id'];

type TOperationItemControllerEvent = {
  ownerId?: UserId;
  beneficiaryId?: UserId;
  ownerWalletAccountId?: WalletAccountId;
  beneficiaryWalletAccountId?: WalletAccountId;
  transactionId: TransactionTypeId;
  transactionTag: TransactionTypeTag;
  currencyId: CurrencyId;
  operationRefId?: OperationRefId;
  userLimitTrackerId?: UserLimitTrackerId;
} & Pick<
  OperationItemEvent,
  | 'id'
  | 'rawValue'
  | 'fee'
  | 'value'
  | 'description'
  | 'state'
  | 'ownerRequestedRawValue'
  | 'ownerRequestedFee'
  | 'analysisTags'
>;

type TOperationControllerEvent = {
  ownerOperation?: TOperationItemControllerEvent;
  beneficiaryOperation?: TOperationItemControllerEvent;
};

class OperationItemControllerEvent
  extends AutoValidator
  implements TOperationItemControllerEvent
{
  @IsUUID(4)
  id: string;

  @IsInt()
  @Min(0)
  rawValue: number;

  @IsInt()
  @Min(0)
  fee: number;

  @IsInt()
  @Min(0)
  value: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  ownerRequestedRawValue: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  ownerRequestedFee: number;

  @IsString()
  @Length(0, 255)
  description: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  ownerId?: UserId;

  @IsInt()
  @IsPositive()
  @IsOptional()
  beneficiaryId?: UserId;

  @IsInt()
  @IsPositive()
  @IsOptional()
  ownerWalletAccountId?: WalletAccountId;

  @IsInt()
  @IsPositive()
  @IsOptional()
  beneficiaryWalletAccountId?: WalletAccountId;

  @IsInt()
  @IsPositive()
  transactionId: TransactionTypeId;

  @IsString()
  @Length(1, 255)
  transactionTag: TransactionTypeTag;

  @IsInt()
  @IsPositive()
  currencyId: CurrencyId;

  @IsUUID(4)
  @IsOptional()
  operationRefId?: OperationRefId;

  @IsEnum(OperationState)
  state: OperationState;

  @IsOptional()
  @IsArray()
  analysisTags?: OperationAnalysisTag[];

  @IsUUID(4)
  @IsOptional()
  userLimitTrackerId?: UserLimitTrackerId;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;

  contructor(props: TOperationItemControllerEvent) {
    Object.assign(this, props);
  }
}

export class OperationControllerEvent
  extends AutoValidator
  implements TOperationControllerEvent
{
  @IsOptional()
  @ValidateNested()
  ownerOperation?: TOperationItemControllerEvent;

  @IsOptional()
  @ValidateNested()
  beneficiaryOperation?: TOperationItemControllerEvent;

  constructor(props: TOperationControllerEvent) {
    super(
      Object.assign(
        {},
        {
          ownerOperation: props.ownerOperation
            ? new OperationItemControllerEvent(props.ownerOperation)
            : null,
        },
        {
          beneficiaryOperation: props.beneficiaryOperation
            ? new OperationItemControllerEvent(props.beneficiaryOperation)
            : null,
        },
      ),
    );
  }
}

export interface OperationEventEmitterControllerInterface {
  /**
   * Emit operation event.
   * @param eventName The event name.
   * @param event Data.
   */
  emitOperationEvent: (
    eventName: OperationEventType,
    event: OperationControllerEvent,
  ) => void;
}

export class OperationEventEmitterController implements OperationEventEmitter {
  constructor(private eventEmitter: OperationEventEmitterControllerInterface) {}

  private formatData(event: OperationEvent): OperationControllerEvent {
    const result: TOperationControllerEvent = {
      ownerOperation: null,
      beneficiaryOperation: null,
    };

    if (event.ownerOperation) {
      result.ownerOperation = new OperationItemControllerEvent({
        id: event.ownerOperation.id,
        value: event.ownerOperation.value,
        fee: event.ownerOperation.fee,
        rawValue: event.ownerOperation.rawValue,
        description: event.ownerOperation.description,
        currencyId: event.ownerOperation.currency.id,
        state: event.ownerOperation.state,
        ownerId: event.ownerOperation.owner?.id,
        beneficiaryId: event.ownerOperation.beneficiary?.id,
        ownerWalletAccountId: event.ownerOperation.ownerWalletAccount?.id,
        beneficiaryWalletAccountId:
          event.ownerOperation.beneficiaryWalletAccount?.id,
        transactionId: event.ownerOperation.transactionType.id,
        transactionTag: event.ownerOperation.transactionType.tag,
        operationRefId: event.ownerOperation.operationRef?.id,
        ownerRequestedRawValue: event.ownerOperation.ownerRequestedRawValue,
        ownerRequestedFee: event.ownerOperation.ownerRequestedFee,
        analysisTags: event.ownerOperation.analysisTags,
        userLimitTrackerId: event.ownerOperation.userLimitTracker?.id,
        createdAt: event.ownerOperation.createdAt,
      });
    }

    if (event.beneficiaryOperation) {
      result.beneficiaryOperation = new OperationItemControllerEvent({
        id: event.beneficiaryOperation.id,
        value: event.beneficiaryOperation.value,
        fee: event.beneficiaryOperation.fee,
        rawValue: event.beneficiaryOperation.rawValue,
        description: event.beneficiaryOperation.description,
        currencyId: event.beneficiaryOperation.currency.id,
        state: event.beneficiaryOperation.state,
        ownerId: event.beneficiaryOperation.owner?.id,
        beneficiaryId: event.beneficiaryOperation.beneficiary?.id,
        ownerWalletAccountId: event.beneficiaryOperation.ownerWalletAccount?.id,
        beneficiaryWalletAccountId:
          event.beneficiaryOperation.beneficiaryWalletAccount?.id,
        transactionId: event.beneficiaryOperation.transactionType.id,
        transactionTag: event.beneficiaryOperation.transactionType.tag,
        operationRefId: event.beneficiaryOperation.operationRef?.id,
        ownerRequestedRawValue:
          event.beneficiaryOperation.ownerRequestedRawValue,
        ownerRequestedFee: event.beneficiaryOperation.ownerRequestedFee,
        analysisTags: event.beneficiaryOperation.analysisTags,
        userLimitTrackerId: event.beneficiaryOperation.userLimitTracker?.id,
        createdAt: event.beneficiaryOperation.createdAt,
      });
    }

    return new OperationControllerEvent(result);
  }

  /**
   * Emit pending event.
   * @param event Data.
   */
  pendingOperation(event: OperationEvent): void {
    const controllerEvent = this.formatData(event);

    this.eventEmitter.emitOperationEvent(
      OperationEventType.PENDING,
      controllerEvent,
    );
  }

  /**
   * Emit accepted event.
   * @param event Data.
   */
  acceptedOperation(event: OperationEvent): void {
    const controllerEvent = this.formatData(event);

    this.eventEmitter.emitOperationEvent(
      OperationEventType.ACCEPTED,
      controllerEvent,
    );
  }

  /**
   * Emit reverted event.
   * @param event Data.
   */
  revertedOperation(event: OperationEvent): void {
    const controllerEvent = this.formatData(event);

    this.eventEmitter.emitOperationEvent(
      OperationEventType.REVERTED,
      controllerEvent,
    );
  }
}
