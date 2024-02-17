import { Logger } from 'winston';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';
import { AutoValidator, IsCpfOrCnpj, IsIsoStringDateFormat } from '@zro/common';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { HandleUserWithdrawSettingRequestFailedByDocumentUseCase } from '@zro/compliance/application';
import {
  TransactionType,
  TransactionTypeEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  DecodedPixKey,
  DecodedPixKeyEntity,
  KeyType,
  PixKey,
  PixKeyEntity,
} from '@zro/pix-keys/domain';
import { User, UserEntity } from '@zro/users/domain';

type THandleUserWithdrawSettingRequestFailedByDocumentRequest = Pick<
  UserWithdrawSettingRequest,
  | 'id'
  | 'state'
  | 'analysisResult'
  | 'type'
  | 'balance'
  | 'day'
  | 'weekDay'
  | 'issueId'
  | 'createdAt'
  | 'updatedAt'
  | 'closedAt'
> & {
  walletId: Wallet['uuid'];
  transactionTypeTag: TransactionType['tag'];
  pixKey: PixKey['key'];
  pixKeyType: PixKey['type'];
  pixKeyDocument?: PixKey['document'];
  userId: User['uuid'];
  decodedPixKeyIspb?: DecodedPixKey['ispb'];
  decodedPixKeyBranch?: DecodedPixKey['branch'];
  decodedPixKeyAccountNumber?: DecodedPixKey['accountNumber'];
  decodedPixKeyName?: DecodedPixKey['name'];
  decodedPixKeyDocument?: DecodedPixKey['document'];
  decodedPixKeyCreatedAt?: DecodedPixKey['createdAt'];
};

export class HandleUserWithdrawSettingRequestFailedByDocumentRequest
  extends AutoValidator
  implements THandleUserWithdrawSettingRequestFailedByDocumentRequest
{
  @IsUUID(4)
  id: string;

  @ValidateIf(
    (body: THandleUserWithdrawSettingRequestFailedByDocumentRequest) =>
      body.state === UserWithdrawSettingRequestState.CLOSED,
  )
  @IsEnum(UserWithdrawSettingRequestAnalysisResultType)
  analysisResult: UserWithdrawSettingRequestAnalysisResultType;

  @IsEnum(UserWithdrawSettingRequestState)
  state: UserWithdrawSettingRequestState;

  @IsEnum(WithdrawSettingType)
  type: WithdrawSettingType;

  @IsUUID(4)
  walletId: Wallet['uuid'];

  @IsInt()
  @IsPositive()
  balance: number;

  @ValidateIf(
    (body: THandleUserWithdrawSettingRequestFailedByDocumentRequest) =>
      body.type === WithdrawSettingType.MONTHLY,
  )
  @IsInt()
  @IsPositive()
  @IsIn([5, 15, 25])
  day?: number;

  @ValidateIf(
    (body: THandleUserWithdrawSettingRequestFailedByDocumentRequest) =>
      body.type === WithdrawSettingType.WEEKLY,
  )
  @IsEnum(WithdrawSettingWeekDays)
  weekDay?: WithdrawSettingWeekDays;

  @IsString()
  @Length(1, 255)
  transactionTypeTag: TransactionType['tag'];

  @IsString()
  @MaxLength(77)
  pixKey: PixKey['key'];

  @IsEnum(KeyType)
  pixKeyType: PixKey['type'];

  @IsOptional()
  @IsCpfOrCnpj()
  pixKeyDocument?: PixKey['document'];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  issueId?: string;

  @IsUUID(4)
  userId: User['uuid'];

  @IsOptional()
  @Length(1, 255)
  decodedPixKeyIspb?: DecodedPixKey['ispb'];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  decodedPixKeyBranch?: DecodedPixKey['branch'];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  decodedPixKeyAccountNumber?: DecodedPixKey['accountNumber'];

  @IsOptional()
  @IsString()
  @Length(1, 255)
  decodedPixKeyName?: DecodedPixKey['name'];

  @IsOptional()
  @IsCpfOrCnpj()
  decodedPixKeyDocument?: DecodedPixKey['document'];

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format decodedPixKeyCreatedAt',
  })
  decodedPixKeyCreatedAt?: DecodedPixKey['createdAt'];

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  @ValidateIf(
    (body: THandleUserWithdrawSettingRequestFailedByDocumentRequest) =>
      body.state === UserWithdrawSettingRequestState.CLOSED,
  )
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format closedAt',
  })
  closedAt: Date;

  constructor(props: THandleUserWithdrawSettingRequestFailedByDocumentRequest) {
    super(props);
  }
}

export class HandleUserWithdrawSettingRequestFailedByDocumentController {
  private usecase: HandleUserWithdrawSettingRequestFailedByDocumentUseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
  ) {
    this.logger = logger.child({
      context: HandleUserWithdrawSettingRequestFailedByDocumentController.name,
    });

    this.usecase = new HandleUserWithdrawSettingRequestFailedByDocumentUseCase(
      this.logger,
      userWithdrawSettingRequestRepository,
    );
  }

  async execute(
    request: HandleUserWithdrawSettingRequestFailedByDocumentRequest,
  ): Promise<void> {
    this.logger.debug(
      'Handle user withdraw setting request failed by document request.',
      { request },
    );

    const wallet = new WalletEntity({ uuid: request.walletId });
    const user = new UserEntity({ uuid: request.userId });
    const transactionType = new TransactionTypeEntity({
      tag: request.transactionTypeTag,
    });
    const pixKey = new PixKeyEntity({
      key: request.pixKey,
      type: request.pixKeyType,
      ...(request.pixKeyDocument && { document: request.pixKeyDocument }),
    });
    const decodedPixKey = new DecodedPixKeyEntity({
      ispb: request.decodedPixKeyIspb,
      branch: request.decodedPixKeyBranch,
      accountNumber: request.decodedPixKeyAccountNumber,
      name: request.decodedPixKeyName,
      document: request.decodedPixKeyDocument,
      createdAt: request.decodedPixKeyCreatedAt,
    });

    const userWithdrawSettingRequest = new UserWithdrawSettingRequestEntity({
      id: request.id,
      state: request.state,
      analysisResult: request.analysisResult,
      wallet,
      user,
      transactionType,
      pixKey,
      decodedPixKey,
      type: request.type,
      balance: request.balance,
      day: request.day,
      weekDay: request.weekDay,
      issueId: request.issueId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      closedAt: request.closedAt,
    });

    await this.usecase.execute(userWithdrawSettingRequest);
  }
}
