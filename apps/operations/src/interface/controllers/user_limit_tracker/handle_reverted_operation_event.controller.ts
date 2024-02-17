import { Logger } from 'winston';
import {
  IsUUID,
  IsString,
  IsEnum,
  IsInt,
  IsPositive,
  IsOptional,
  Min,
  ValidateNested,
  Length,
  IsArray,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  UserLimitTrackerRepository,
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
  OperationState,
  TransactionType,
  TransactionTypeEntity,
  WalletAccount,
  UserLimitRepository,
  OperationRepository,
  OperationAnalysisTag,
  UserLimitTracker,
  UserLimitTrackerEntity,
} from '@zro/operations/domain';
import {
  HandleRevertedOperationEventUseCase as UseCase,
  OperationItemEvent,
} from '@zro/operations/application';

type UserId = User['id'];
type CurrencyId = Currency['id'];
type OperationRefId = Operation['id'];
type WalletAccountId = WalletAccount['id'];
type TransactionTypeId = TransactionType['id'];
type TransactionTypeTag = TransactionType['tag'];
type UserLimitTrackerId = UserLimitTracker['id'];

type THandleRevertedOperationItemEventRequest = {
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
  | 'createdAt'
>;

type THandleRevertedOperationEventRequest = {
  ownerOperation?: THandleRevertedOperationItemEventRequest;
  beneficiaryOperation?: THandleRevertedOperationItemEventRequest;
};

class HandleRevertedOperationItemEventRequest
  extends AutoValidator
  implements THandleRevertedOperationItemEventRequest
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
  ownerRequestedRawValue?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  ownerRequestedFee?: number;

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  analysisTags?: OperationAnalysisTag[];

  @IsUUID(4)
  @IsOptional()
  userLimitTrackerId?: UserLimitTrackerId;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;
}

export class HandleRevertedOperationEventRequest
  extends AutoValidator
  implements THandleRevertedOperationEventRequest
{
  @IsOptional()
  @ValidateNested()
  ownerOperation?: HandleRevertedOperationItemEventRequest;

  @IsOptional()
  @ValidateNested()
  beneficiaryOperation?: HandleRevertedOperationItemEventRequest;

  constructor(props: THandleRevertedOperationEventRequest) {
    super(
      Object.assign(
        {},
        {
          ownerOperation: props.ownerOperation
            ? new HandleRevertedOperationItemEventRequest(props.ownerOperation)
            : null,
        },
        {
          beneficiaryOperation: props.beneficiaryOperation
            ? new HandleRevertedOperationItemEventRequest(
                props.beneficiaryOperation,
              )
            : null,
        },
      ),
    );
  }
}

export class HandleRevertedOperationEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userLimitTrackerRepository: UserLimitTrackerRepository,
    userLimitRepository: UserLimitRepository,
    operationRepository: OperationRepository,
  ) {
    this.logger = logger.child({
      context: HandleRevertedOperationEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      userLimitTrackerRepository,
      userLimitRepository,
      operationRepository,
    );
  }

  async execute(request: HandleRevertedOperationEventRequest): Promise<void> {
    this.logger.debug('Handle reverted operation event request.', {
      request,
    });

    let ownerOperation: Operation = null;
    let beneficiaryOperation: Operation = null;

    if (request.ownerOperation) {
      const {
        id,
        value,
        fee,
        rawValue,
        description,
        ownerId,
        transactionId,
        transactionTag,
        currencyId,
        operationRefId,
        ownerRequestedRawValue,
        ownerRequestedFee,
        analysisTags,
        userLimitTrackerId,
        createdAt,
      } = request.ownerOperation;

      ownerOperation = new OperationEntity({
        id,
        value,
        rawValue,
        fee,
        description,
        ownerRequestedRawValue,
        ownerRequestedFee,
        analysisTags,
        createdAt,
      });
      ownerOperation.userLimitTracker = new UserLimitTrackerEntity({
        id: userLimitTrackerId,
      });
      ownerOperation.currency = new CurrencyEntity({ id: currencyId });
      ownerOperation.owner = ownerId && new UserEntity({ id: ownerId });
      ownerOperation.transactionType = new TransactionTypeEntity({
        id: transactionId,
        tag: transactionTag,
      });
      ownerOperation.operationRef =
        operationRefId && new OperationEntity({ id: operationRefId });
    }

    if (request.beneficiaryOperation) {
      const {
        id,
        value,
        fee,
        rawValue,
        description,
        beneficiaryId,
        transactionId,
        transactionTag,
        currencyId,
        operationRefId,
        ownerRequestedRawValue,
        ownerRequestedFee,
        analysisTags,
        createdAt,
        userLimitTrackerId,
      } = request.beneficiaryOperation;

      beneficiaryOperation = new OperationEntity({
        id,
        value,
        rawValue,
        fee,
        description,
        ownerRequestedRawValue,
        ownerRequestedFee,
        analysisTags,
        createdAt,
      });
      ownerOperation.userLimitTracker = new UserLimitTrackerEntity({
        id: userLimitTrackerId,
      });
      beneficiaryOperation.currency = new CurrencyEntity({ id: currencyId });
      beneficiaryOperation.beneficiary =
        beneficiaryId && new UserEntity({ id: beneficiaryId });
      beneficiaryOperation.transactionType = new TransactionTypeEntity({
        id: transactionId,
        tag: transactionTag,
      });
      beneficiaryOperation.operationRef =
        operationRefId && new OperationEntity({ id: operationRefId });
    }

    await this.usecase.execute(ownerOperation, beneficiaryOperation);

    this.logger.debug('Handle reverted operation event finished.');
  }
}
