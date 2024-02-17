import { Logger } from 'winston';
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
import { AutoValidator, Failed, IsIsoStringDateFormat } from '@zro/common';
import { PersonDocumentType, User, UserEntity } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import {
  PixDeposit,
  PixDevolution,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import { GetPixDevolutionByIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];
type DepositId = PixDeposit['id'];

type DepositTxId = PixDeposit['txId'];
type DepositClientName = PixDeposit['clientName'];
type DepositClientPersonType = PixDeposit['clientPersonType'];
type DepositClientDocument = PixDeposit['clientDocument'];
type DepositClientAccountNumber = PixDeposit['clientAccountNumber'];
type DepositClientBranch = PixDeposit['clientBranch'];
type DepositClientBankName = PixDeposit['clientBank']['name'];
type DepositClientBankIspb = PixDeposit['clientBank']['ispb'];
type DepositThirdPartName = PixDeposit['thirdPartName'];
type DepositThirdPartPersonType = PixDeposit['thirdPartPersonType'];
type DepositThirdPartDocument = PixDeposit['thirdPartDocument'];
type DepositThirdPartAccountNumber = PixDeposit['thirdPartAccountNumber'];
type DepositThirdPartBranch = PixDeposit['thirdPartBranch'];
type DepositThirdPartBankName = PixDeposit['thirdPartBank']['name'];
type DepositThirdPartBankIspb = PixDeposit['thirdPartBank']['ispb'];

type TGetPixDevolutionByIdRequest = Pick<PixDevolution, 'id'> & {
  userId?: UserId;
  walletId?: WalletId;
};

export class GetPixDevolutionByIdRequest
  extends AutoValidator
  implements TGetPixDevolutionByIdRequest
{
  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  @IsUUID(4)
  id: string;

  constructor(props: TGetPixDevolutionByIdRequest) {
    super(props);
  }
}

type TGetPixDevolutionByIdResponse = Pick<
  PixDevolution,
  | 'id'
  | 'amount'
  | 'description'
  | 'state'
  | 'createdAt'
  | 'failed'
  | 'endToEndId'
> & {
  userId: UserId;
  walletId: WalletId;
  operationId: OperationId;
  depositId: DepositId;
  depositTxId: DepositTxId;
  depositClientName: DepositClientName;
  depositClientPersonType: DepositClientPersonType;
  depositClientDocument: DepositClientDocument;
  depositClientAccountNumber: DepositClientAccountNumber;
  depositClientBranch: DepositClientBranch;
  depositClientBankName: DepositClientBankName;
  depositClientBankIspb: DepositClientBankIspb;
  depositThirdPartName: DepositThirdPartName;
  depositThirdPartPersonType: DepositThirdPartPersonType;
  depositThirdPartDocument: DepositThirdPartDocument;
  depositThirdPartAccountNumber: DepositThirdPartAccountNumber;
  depositThirdPartBranch: DepositThirdPartBranch;
  depositThirdPartBankName: DepositThirdPartBankName;
  depositThirdPartBankIspb: DepositThirdPartBankIspb;
};

export class GetPixDevolutionByIdResponse
  extends AutoValidator
  implements TGetPixDevolutionByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId?: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  @IsEnum(PixDevolutionState)
  state: PixDevolutionState;

  @IsUUID(4)
  operationId: OperationId;

  @IsUUID(4)
  depositId: DepositId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositTxId: DepositTxId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositClientName: DepositClientName;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  depositClientPersonType: DepositClientPersonType;

  @IsString()
  @Length(11, 14)
  depositClientDocument: DepositClientDocument;

  @IsString()
  @MaxLength(255)
  depositClientAccountNumber: DepositClientAccountNumber;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositClientBranch: DepositClientBranch;

  @IsString()
  @MaxLength(255)
  depositClientBankName: DepositClientBankName;

  @IsString()
  @MaxLength(255)
  depositClientBankIspb: DepositClientBankIspb;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositThirdPartName: DepositThirdPartName;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  depositThirdPartPersonType: DepositThirdPartPersonType;

  @IsString()
  @Length(11, 14)
  depositThirdPartDocument: DepositThirdPartDocument;

  @IsString()
  @MaxLength(255)
  depositThirdPartAccountNumber: DepositThirdPartAccountNumber;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  depositThirdPartBranch: DepositThirdPartBranch;

  @IsString()
  @MaxLength(255)
  depositThirdPartBankName: DepositThirdPartBankName;

  @IsString()
  @MaxLength(255)
  depositThirdPartBankIspb: DepositThirdPartBankIspb;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetPixDevolutionByIdResponse) {
    super(props);
  }
}

export class GetByPixDevolutionIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    paymentRepository: PixDevolutionRepository,
  ) {
    this.logger = logger.child({
      context: GetByPixDevolutionIdController.name,
    });

    this.usecase = new UseCase(this.logger, paymentRepository);
  }

  async execute(
    request: GetPixDevolutionByIdRequest,
  ): Promise<GetPixDevolutionByIdResponse> {
    this.logger.debug('Get devolution by id request.', { request });
    const { id, userId, walletId } = request;

    const wallet = walletId && new WalletEntity({ uuid: walletId });
    const user = userId && new UserEntity({ uuid: userId });

    const devolution = await this.usecase.execute(id, user, wallet);

    if (!devolution) return null;

    const response = new GetPixDevolutionByIdResponse({
      id: devolution.id,
      endToEndId: devolution.endToEndId,
      state: devolution.state,
      userId: devolution.user.uuid,
      walletId: devolution.wallet.uuid,
      amount: devolution.amount,
      description: devolution.description,
      failed: devolution.failed,
      operationId: devolution.operation.id,
      depositId: devolution.deposit.id,
      depositTxId: devolution.deposit.txId,
      depositClientName: devolution.deposit.clientName,
      depositClientPersonType: devolution.deposit.clientPersonType,
      depositClientDocument: devolution.deposit.clientDocument,
      depositClientAccountNumber: devolution.deposit.clientAccountNumber,
      depositClientBranch: devolution.deposit.clientBranch,
      depositClientBankName: devolution.deposit.clientBank.name,
      depositClientBankIspb: devolution.deposit.clientBank.ispb,
      depositThirdPartName: devolution.deposit.thirdPartName,
      depositThirdPartPersonType: devolution.deposit.thirdPartPersonType,
      depositThirdPartDocument: devolution.deposit.thirdPartDocument,
      depositThirdPartAccountNumber: devolution.deposit.thirdPartAccountNumber,
      depositThirdPartBranch: devolution.deposit.thirdPartBranch,
      depositThirdPartBankName: devolution.deposit.thirdPartBank.name,
      depositThirdPartBankIspb: devolution.deposit.thirdPartBank.ispb,
      createdAt: devolution.createdAt,
    });

    this.logger.info('Get devolution by id response.', {
      devolution: response,
    });

    return response;
  }
}
