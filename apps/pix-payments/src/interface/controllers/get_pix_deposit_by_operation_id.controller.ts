import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { User, UserEntity, PersonDocumentType } from '@zro/users/domain';
import { Bank } from '@zro/banking/domain';
import {
  AccountType,
  PixDeposit,
  PixDepositRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import { GetPixDepositByOperationIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TGetPixDepositByOperationIdRequest = {
  userId?: UserId;
  walletId?: WalletId;
  operationId: OperationId;
};

export class GetPixDepositByOperationIdRequest
  extends AutoValidator
  implements TGetPixDepositByOperationIdRequest
{
  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TGetPixDepositByOperationIdRequest) {
    super(props);
  }
}

type TGetPixDepositByOperationIdResponse = Pick<
  PixDeposit,
  | 'id'
  | 'state'
  | 'amount'
  | 'clientBank'
  | 'clientBranch'
  | 'clientAccountNumber'
  | 'clientPersonType'
  | 'clientDocument'
  | 'clientName'
  | 'clientKey'
  | 'thirdPartBank'
  | 'thirdPartBranch'
  | 'thirdPartAccountType'
  | 'thirdPartAccountNumber'
  | 'thirdPartPersonType'
  | 'thirdPartDocument'
  | 'thirdPartName'
  | 'thirdPartKey'
  | 'createdAt'
> & { userId: UserId; availableAmount: number };

export class GetPixDepositByOperationIdResponse
  extends AutoValidator
  implements TGetPixDepositByOperationIdResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @IsInt()
  @Min(0)
  amount: number;

  @IsInt()
  availableAmount: number;

  @IsEnum(PixDepositState)
  state: PixDepositState;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsObject()
  thirdPartBank: Bank;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  thirdPartBranch: string;

  @IsOptional()
  @IsEnum(AccountType)
  thirdPartAccountType: AccountType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  thirdPartPersonType: PersonDocumentType;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  thirdPartKey: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientName: string;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsObject()
  clientBank: Bank;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientBranch: string;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  clientPersonType: PersonDocumentType;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  clientKey: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetPixDepositByOperationIdResponse) {
    super(props);
  }
}

export class GetPixDepositByOperationIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDepositByOperationIdController.name,
    });

    this.usecase = new UseCase(this.logger, depositRepository);
  }

  async execute(
    request: GetPixDepositByOperationIdRequest,
  ): Promise<GetPixDepositByOperationIdResponse> {
    this.logger.debug('Get deposit by operation id request.', { request });
    const { operationId, userId, walletId } = request;

    const wallet = walletId && new WalletEntity({ uuid: walletId });
    const user = userId && new UserEntity({ uuid: userId });
    const operation = new OperationEntity({ id: operationId });

    const deposit = await this.usecase.execute(operation, user, wallet);

    if (!deposit) return null;

    const response = new GetPixDepositByOperationIdResponse({
      id: deposit.id,
      state: deposit.state,
      userId: deposit.user.uuid,
      amount: deposit.amount,
      availableAmount: deposit.amount - deposit.returnedAmount,
      createdAt: deposit.createdAt,
      clientBank: deposit.clientBank,
      clientBranch: deposit.clientBranch,
      clientAccountNumber: deposit.clientAccountNumber,
      clientPersonType: deposit.clientPersonType,
      clientDocument: deposit.clientDocument,
      clientName: deposit.clientName,
      clientKey: deposit.clientKey,
      thirdPartBank: deposit.thirdPartBank,
      thirdPartBranch: deposit.thirdPartBranch,
      thirdPartAccountType: deposit.thirdPartAccountType,
      thirdPartAccountNumber: deposit.thirdPartAccountNumber,
      thirdPartPersonType: deposit.thirdPartPersonType,
      thirdPartDocument: deposit.thirdPartDocument,
      thirdPartName: deposit.thirdPartName,
      thirdPartKey: deposit.thirdPartKey,
    });

    this.logger.info('Get deposit by operation id response.', {
      deposit: response,
    });

    return response;
  }
}
