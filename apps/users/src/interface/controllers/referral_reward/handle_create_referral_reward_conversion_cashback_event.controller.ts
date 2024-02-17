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
import {
  OnboardingRepository,
  ReferralRewardRepository,
  User,
  UserEntity,
  UserRepository,
} from '@zro/users/domain';
import {
  Currency,
  CurrencyEntity,
  Operation,
  OperationAnalysisTag,
  OperationEntity,
  OperationState,
  TransactionType,
  TransactionTypeEntity,
  UserLimitTracker,
  WalletAccount,
} from '@zro/operations/domain';
import {
  CurrencyNotActiveException,
  OperationItemEvent,
} from '@zro/operations/application';
import {
  HandleCreateReferralRewardConversionCashbackEventUseCase as UseCase,
  OperationService,
} from '@zro/users/application';

type UserId = User['id'];
type CurrencyId = Currency['id'];
type OperationRefId = Operation['id'];
type WalletAccountId = WalletAccount['id'];
type TransactionTypeId = TransactionType['id'];
type TransactionTypeTag = TransactionType['tag'];
type UserLimitTrackerId = UserLimitTracker['id'];

type THandleCreateReferralRewardConversionCashbackItemEventRequest = {
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

type THandleCreateReferralRewardConversionCashbackEventRequest = {
  ownerOperation?: THandleCreateReferralRewardConversionCashbackItemEventRequest;
  beneficiaryOperation?: THandleCreateReferralRewardConversionCashbackItemEventRequest;
};

class HandleCreateReferralRewardConversionCashbackItemEventRequest
  extends AutoValidator
  implements THandleCreateReferralRewardConversionCashbackItemEventRequest
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

export class HandleCreateReferralRewardConversionCashbackEventRequest
  extends AutoValidator
  implements THandleCreateReferralRewardConversionCashbackEventRequest
{
  @IsOptional()
  @ValidateNested()
  ownerOperation?: HandleCreateReferralRewardConversionCashbackItemEventRequest;

  @IsOptional()
  @ValidateNested()
  beneficiaryOperation?: HandleCreateReferralRewardConversionCashbackItemEventRequest;

  constructor(
    props: THandleCreateReferralRewardConversionCashbackEventRequest,
  ) {
    super(
      Object.assign(
        {},
        {
          ownerOperation: props.ownerOperation
            ? new HandleCreateReferralRewardConversionCashbackItemEventRequest(
                props.ownerOperation,
              )
            : null,
        },
        {
          beneficiaryOperation: props.beneficiaryOperation
            ? new HandleCreateReferralRewardConversionCashbackItemEventRequest(
                props.beneficiaryOperation,
              )
            : null,
        },
      ),
    );
  }
}

export class HandleCreateReferralRewardConversionCashbackEventController {
  private usecase: UseCase;
  private conversionCurrency: Currency;

  constructor(
    private logger: Logger,
    userRepository: UserRepository,
    onboardingRepository: OnboardingRepository,
    referralRewardRepository: ReferralRewardRepository,
    private readonly operationService: OperationService,
    private readonly conversionCurrencySymbol: string,
    transactionTagValid: string,
    affiliateMonthMinimum: number,
    cashbackAmountBps: number,
  ) {
    this.logger = logger.child({
      context: HandleCreateReferralRewardConversionCashbackEventController.name,
    });
    this.usecase = new UseCase(
      this.logger,
      userRepository,
      onboardingRepository,
      referralRewardRepository,
      transactionTagValid,
      affiliateMonthMinimum,
      cashbackAmountBps,
    );
  }

  async execute(
    request: HandleCreateReferralRewardConversionCashbackEventRequest,
  ): Promise<void> {
    this.logger.debug(
      'Handle create referral reward conversion cashback event request.',
      { request },
    );

    let ownerOperation: Operation = null,
      beneficiaryOperation: Operation = null;

    if (request.ownerOperation) {
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
        ownerRequestedRawValue,
        ownerRequestedFee,
      } = request.ownerOperation;

      ownerOperation = new OperationEntity({
        id,
        value,
        rawValue,
        fee,
        description,
        ownerRequestedRawValue,
        ownerRequestedFee,
      });
      ownerOperation.currency = new CurrencyEntity({ id: currencyId });
      ownerOperation.owner = ownerId && new UserEntity({ id: ownerId });
      ownerOperation.beneficiary =
        beneficiaryId && new UserEntity({ id: beneficiaryId });
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
        ownerId,
        beneficiaryId,
        transactionId,
        transactionTag,
        currencyId,
        operationRefId,
        ownerRequestedRawValue,
        ownerRequestedFee,
      } = request.beneficiaryOperation;

      beneficiaryOperation = new OperationEntity({
        id,
        value,
        rawValue,
        fee,
        description,
        ownerRequestedRawValue,
        ownerRequestedFee,
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
    }

    await this.usecase.execute(
      ownerOperation,
      beneficiaryOperation,
      await this.loadConversionCurrency(),
    );
  }

  private async loadConversionCurrency(): Promise<Currency> {
    // Check if conversion currency has been found before.
    if (this.conversionCurrencySymbol && this.conversionCurrency) {
      return this.conversionCurrency;
    }

    this.logger.info('Getting conversion currency.');

    // If not, searches conversion currency.
    this.conversionCurrency = await this.operationService.getCurrencyBySymbol(
      this.conversionCurrencySymbol,
    );

    this.logger.info('Conversion currency found.', {
      conversionCurrency: this.conversionCurrency,
    });

    if (!this.conversionCurrency?.isActive()) {
      throw new CurrencyNotActiveException(this.conversionCurrency);
    }

    return this.conversionCurrency;
  }
}
