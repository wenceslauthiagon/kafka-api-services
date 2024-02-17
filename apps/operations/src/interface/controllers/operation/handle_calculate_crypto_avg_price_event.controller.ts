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
  Currency,
  CurrencyEntity,
  Operation,
  OperationState,
  OperationEntity,
  WalletAccount,
  TransactionType,
  TransactionTypeEntity,
  WalletAccountRepository,
  CurrencyRepository,
  OperationRepository,
  WalletAccountEntity,
  OperationAnalysisTag,
  UserLimitTracker,
} from '@zro/operations/domain';
import {
  OtcService,
  OperationItemEvent,
  HandleCalculateCryptoAvgPriceEventUseCase as UseCase,
} from '@zro/operations/application';

type UserId = User['id'];
type CurrencyId = Currency['id'];
type OperationRefId = Operation['id'];
type WalletAccountId = WalletAccount['id'];
type TransactionTypeId = TransactionType['id'];
type TransactionTypeTag = TransactionType['tag'];
type UserLimitTrackerId = UserLimitTracker['id'];

type THandleCalculateCryptoAvgPriceItemEventRequest = {
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

type THandleCalculateCryptoAvgPriceEventRequest = {
  beneficiaryOperation?: THandleCalculateCryptoAvgPriceItemEventRequest;
};

class HandleCalculateCryptoAvgPriceItemEventRequest
  extends AutoValidator
  implements THandleCalculateCryptoAvgPriceItemEventRequest
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

export class HandleCalculateCryptoAvgPriceEventRequest
  extends AutoValidator
  implements THandleCalculateCryptoAvgPriceEventRequest
{
  @IsOptional()
  @ValidateNested()
  ownerOperation?: HandleCalculateCryptoAvgPriceItemEventRequest;

  @IsOptional()
  @ValidateNested()
  beneficiaryOperation?: HandleCalculateCryptoAvgPriceItemEventRequest;

  constructor(props: THandleCalculateCryptoAvgPriceEventRequest) {
    super(
      Object.assign(
        {},
        {
          beneficiaryOperation: props.beneficiaryOperation
            ? new HandleCalculateCryptoAvgPriceItemEventRequest(
                props.beneficiaryOperation,
              )
            : null,
        },
      ),
    );
  }
}

export class HandleCalculateCryptoAvgPriceEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletAccountRepository: WalletAccountRepository,
    operationRepository: OperationRepository,
    currencyRepository: CurrencyRepository,
    otcService: OtcService,
    cryptoTransactionTags: string,
  ) {
    this.logger = logger.child({
      context: HandleCalculateCryptoAvgPriceEventController.name,
    });
    this.usecase = new UseCase(
      this.logger,
      walletAccountRepository,
      operationRepository,
      currencyRepository,
      otcService,
      cryptoTransactionTags,
    );
  }

  async execute(
    request: HandleCalculateCryptoAvgPriceEventRequest,
  ): Promise<void> {
    this.logger.debug('Handle calculate avg crypto price event request.', {
      request,
    });

    if (!request.beneficiaryOperation) {
      return null;
    }

    const {
      id,
      value,
      fee,
      rawValue,
      description,
      ownerId,
      beneficiaryId,
      transactionId,
      transactionTag,
      currencyId,
      operationRefId,
      beneficiaryWalletAccountId,
    } = request.beneficiaryOperation;

    const beneficiaryOperation = new OperationEntity({
      id,
      value,
      rawValue,
      fee,
      description,
    });
    beneficiaryOperation.currency = new CurrencyEntity({ id: currencyId });
    beneficiaryOperation.owner = ownerId && new UserEntity({ id: ownerId });
    beneficiaryOperation.beneficiary =
      beneficiaryId && new UserEntity({ id: beneficiaryId });
    beneficiaryOperation.transactionType = new TransactionTypeEntity({
      id: transactionId,
      tag: transactionTag,
    });
    beneficiaryOperation.operationRef =
      operationRefId && new OperationEntity({ id: operationRefId });
    beneficiaryOperation.beneficiaryWalletAccount =
      beneficiaryWalletAccountId &&
      new WalletAccountEntity({ id: beneficiaryWalletAccountId });

    await this.usecase.execute(beneficiaryOperation);

    this.logger.debug('Handle calculate avg crypto price event finished.');
  }
}
