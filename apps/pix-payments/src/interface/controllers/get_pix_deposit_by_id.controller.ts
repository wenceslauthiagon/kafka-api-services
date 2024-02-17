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
import { PersonDocumentType, User, UserEntity } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import { Bank } from '@zro/banking/domain';
import {
  AccountType,
  PixDeposit,
  PixDepositRepository,
  PixDepositState,
} from '@zro/pix-payments/domain';
import { GetPixDepositByIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type TGetPixDepositByIdRequest = Pick<PixDeposit, 'id'> & {
  userId?: UserId;
  walletId?: WalletId;
};

export class GetPixDepositByIdRequest
  extends AutoValidator
  implements TGetPixDepositByIdRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  constructor(props: TGetPixDepositByIdRequest) {
    super(props);
  }
}

type TGetPixDepositByIdResponse = Pick<
  PixDeposit,
  | 'id'
  | 'endToEndId'
  | 'txId'
  | 'state'
  | 'amount'
  | 'operation'
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
>;

export class GetPixDepositByIdResponse
  extends AutoValidator
  implements TGetPixDepositByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId: string;

  @IsInt()
  @Min(0)
  amount: number;

  @IsEnum(PixDepositState)
  state: PixDepositState;

  @IsObject()
  operation: Operation;

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

  constructor(props: TGetPixDepositByIdResponse) {
    super(props);
  }
}

export class GetPixDepositByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDepositByIdController.name,
    });

    this.usecase = new UseCase(this.logger, depositRepository);
  }

  async execute(
    request: GetPixDepositByIdRequest,
  ): Promise<GetPixDepositByIdResponse> {
    this.logger.debug('Get deposit by operation id request.', { request });

    const { id, userId, walletId } = request;

    const user = userId && new UserEntity({ uuid: userId });
    const wallet = walletId && new WalletEntity({ uuid: walletId });

    const deposit = await this.usecase.execute(id, user, wallet);

    if (!deposit) return null;

    const response = new GetPixDepositByIdResponse({
      id: deposit.id,
      endToEndId: deposit.endToEndId,
      txId: deposit.txId,
      state: deposit.state,
      amount: deposit.amount,
      operation: deposit.operation,
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

    this.logger.info('Get deposit by id response.', {
      deposit: response,
    });

    return response;
  }
}
