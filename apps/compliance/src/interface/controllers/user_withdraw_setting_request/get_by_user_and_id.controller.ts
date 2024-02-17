import { Logger } from 'winston';
import {
  IsUUID,
  IsInt,
  IsDate,
  IsEnum,
  IsString,
  Length,
  IsPositive,
  MaxLength,
  ValidateIf,
  IsIn,
  IsOptional,
} from 'class-validator';
import { AutoValidator, IsCpfOrCnpj } from '@zro/common';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';
import { User, UserEntity } from '@zro/users/domain';
import { KeyType, PixKey } from '@zro/pix-keys/domain';
import { TransactionType, Wallet } from '@zro/operations/domain';
import { GetUserWithdrawSettingRequestByUserAndIdUseCase } from '@zro/compliance/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type TransactionTypeTag = TransactionType['tag'];

type TGetUserWithdrawSettingRequestByUserAndIdRequest = Pick<
  UserWithdrawSettingRequest,
  'id'
> & { userId: UserId };

export class GetUserWithdrawSettingRequestByUserAndIdRequest
  extends AutoValidator
  implements TGetUserWithdrawSettingRequestByUserAndIdRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  constructor(props: TGetUserWithdrawSettingRequestByUserAndIdRequest) {
    super(props);
  }
}

type TGetUserWithdrawSettingRequestByUserAndIdResponse = Pick<
  UserWithdrawSettingRequest,
  | 'id'
  | 'state'
  | 'analysisResult'
  | 'type'
  | 'balance'
  | 'day'
  | 'weekDay'
  | 'createdAt'
  | 'updatedAt'
  | 'closedAt'
> & {
  walletId: WalletId;
  transactionTypeTag: TransactionTypeTag;
  pixKey: PixKey['key'];
  pixKeyType: PixKey['type'];
  pixKeyDocument?: PixKey['document'];
};

export class GetUserWithdrawSettingRequestByUserAndIdResponse
  extends AutoValidator
  implements TGetUserWithdrawSettingRequestByUserAndIdResponse
{
  @IsUUID(4)
  id: string;

  @ValidateIf(
    (body: GetUserWithdrawSettingRequestByUserAndIdResponse) =>
      body.state === UserWithdrawSettingRequestState.CLOSED,
  )
  @IsEnum(UserWithdrawSettingRequestAnalysisResultType)
  analysisResult: UserWithdrawSettingRequestAnalysisResultType;

  @IsEnum(UserWithdrawSettingRequestState)
  state: UserWithdrawSettingRequestState;

  @IsEnum(WithdrawSettingType)
  type: WithdrawSettingType;

  @IsUUID(4)
  walletId: WalletId;

  @IsInt()
  @IsPositive()
  balance: number;

  @ValidateIf(
    (body: GetUserWithdrawSettingRequestByUserAndIdResponse) =>
      body.type === WithdrawSettingType.MONTHLY,
  )
  @IsInt()
  @IsPositive()
  @IsIn([5, 15, 25])
  day?: number;

  @ValidateIf(
    (body: GetUserWithdrawSettingRequestByUserAndIdResponse) =>
      body.type === WithdrawSettingType.WEEKLY,
  )
  @IsEnum(WithdrawSettingWeekDays)
  weekDay?: WithdrawSettingWeekDays;

  @IsString()
  @Length(1, 255)
  transactionTypeTag: TransactionTypeTag;

  @IsString()
  @MaxLength(77)
  pixKey: PixKey['key'];

  @IsEnum(KeyType)
  pixKeyType: PixKey['type'];

  @IsOptional()
  @IsCpfOrCnpj()
  pixKeyDocument?: PixKey['document'];

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @ValidateIf(
    (body: GetUserWithdrawSettingRequestByUserAndIdResponse) =>
      body.state === UserWithdrawSettingRequestState.CLOSED,
  )
  @IsDate()
  closedAt: Date;

  constructor(props: TGetUserWithdrawSettingRequestByUserAndIdResponse) {
    super(props);
  }
}

export class GetUserWithdrawSettingRequestByUserAndIdController {
  private usecase: GetUserWithdrawSettingRequestByUserAndIdUseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
  ) {
    this.logger = logger.child({
      context: GetUserWithdrawSettingRequestByUserAndIdController.name,
    });

    this.usecase = new GetUserWithdrawSettingRequestByUserAndIdUseCase(
      this.logger,
      userWithdrawSettingRequestRepository,
    );
  }

  async execute(
    request: GetUserWithdrawSettingRequestByUserAndIdRequest,
  ): Promise<GetUserWithdrawSettingRequestByUserAndIdResponse> {
    this.logger.debug('Get user withdraw setting by user and id request.', {
      request,
    });

    const { id, userId } = request;

    const user = new UserEntity({ uuid: userId });

    const result = await this.usecase.execute(id, user);

    const response =
      result &&
      new GetUserWithdrawSettingRequestByUserAndIdResponse({
        id: result.id,
        analysisResult: result.analysisResult,
        state: result.state,
        type: result.type,
        balance: result.balance,
        day: result.day,
        weekDay: result.weekDay,
        walletId: result.wallet.uuid,
        transactionTypeTag: result.transactionType.tag,
        pixKey: result.pixKey.key,
        pixKeyType: result.pixKey.type,
        pixKeyDocument: result.pixKey.document,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        closedAt: result.closedAt,
      });

    this.logger.info(
      'Get user withdraw setting request by user and id response.',
      { response },
    );

    return response;
  }
}
