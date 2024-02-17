import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  IsObject,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { Bank } from '@zro/banking/domain';
import {
  AccountType,
  PixDevolutionReceived,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import { PersonDocumentType, User, UserEntity } from '@zro/users/domain';
import { GetPixDevolutionReceivedByIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TGetPixDevolutionReceivedByIdRequest = Pick<
  PixDevolutionReceived,
  'id'
> & { userId?: UserId; walletId?: WalletId };

type ClientBankName = PixDevolutionReceived['clientBank']['name'];
type ClientBankIspb = PixDevolutionReceived['clientBank']['ispb'];
type ThirdPartBankName = PixDevolutionReceived['thirdPartBank']['name'];
type ThirdPartBankIspb = PixDevolutionReceived['thirdPartBank']['ispb'];

export class GetPixDevolutionReceivedByIdRequest
  extends AutoValidator
  implements TGetPixDevolutionReceivedByIdRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  constructor(props: TGetPixDevolutionReceivedByIdRequest) {
    super(props);
  }
}

type TGetPixDevolutionReceivedByIdResponse = Pick<
  PixDevolutionReceived,
  | 'id'
  | 'amount'
  | 'txId'
  | 'endToEndId'
  | 'clientBank'
  | 'clientBranch'
  | 'clientAccountNumber'
  | 'clientDocument'
  | 'clientPersonType'
  | 'clientName'
  | 'clientKey'
  | 'thirdPartBank'
  | 'thirdPartBranch'
  | 'thirdPartAccountType'
  | 'thirdPartAccountNumber'
  | 'thirdPartDocument'
  | 'thirdPartPersonType'
  | 'thirdPartName'
  | 'thirdPartKey'
  | 'description'
  | 'state'
  | 'createdAt'
> & {
  operationId: OperationId;
  clientBankName: ClientBankName;
  clientBankIspb: ClientBankIspb;
  thirdPartBankName: ThirdPartBankName;
  thirdPartBankIspb: ThirdPartBankIspb;
};

export class GetPixDevolutionReceivedByIdResponse
  extends AutoValidator
  implements TGetPixDevolutionReceivedByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  endToEndId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsObject()
  clientBank: Bank;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  clientBranch: string;

  @IsString()
  @MaxLength(255)
  clientAccountNumber: string;

  @IsString()
  @Length(11, 14)
  clientDocument: string;

  @IsEnum(PersonDocumentType)
  clientPersonType: PersonDocumentType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientName: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  clientKey: string;

  @IsString()
  @MaxLength(255)
  clientBankName: ClientBankName;

  @IsString()
  @MaxLength(255)
  clientBankIspb: ClientBankIspb;

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

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsEnum(PersonDocumentType)
  thirdPartPersonType: PersonDocumentType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  thirdPartKey: string;

  @IsString()
  @MaxLength(255)
  thirdPartBankName: ThirdPartBankName;

  @IsString()
  @MaxLength(255)
  thirdPartBankIspb: ThirdPartBankIspb;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  description: string;

  @IsEnum(PixDevolutionReceivedState)
  state: PixDevolutionReceivedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetPixDevolutionReceivedByIdResponse) {
    super(props);
  }
}

export class GetPixDevolutionReceivedByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDevolutionReceivedByIdController.name,
    });

    this.usecase = new UseCase(this.logger, devolutionReceivedRepository);
  }

  async execute(
    request: GetPixDevolutionReceivedByIdRequest,
  ): Promise<GetPixDevolutionReceivedByIdResponse> {
    this.logger.debug('Get devolution received by id request.', { request });

    const { id, userId, walletId } = request;
    const user = userId && new UserEntity({ uuid: userId });
    const wallet = walletId && new WalletEntity({ uuid: walletId });

    const devolutionReceived = await this.usecase.execute(id, user, wallet);

    if (!devolutionReceived) return null;

    const response = new GetPixDevolutionReceivedByIdResponse({
      id: devolutionReceived.id,
      operationId: devolutionReceived.operation.id,
      amount: devolutionReceived.amount,
      txId: devolutionReceived.txId,
      endToEndId: devolutionReceived.endToEndId,
      clientBank: devolutionReceived.clientBank,
      clientBranch: devolutionReceived.clientBranch,
      clientAccountNumber: devolutionReceived.clientAccountNumber,
      clientDocument: devolutionReceived.clientDocument,
      clientPersonType: devolutionReceived.clientPersonType,
      clientName: devolutionReceived.clientName,
      clientKey: devolutionReceived.clientKey,
      clientBankName: devolutionReceived.clientBank.name,
      clientBankIspb: devolutionReceived.clientBank.ispb,
      thirdPartBank: devolutionReceived.thirdPartBank,
      thirdPartBranch: devolutionReceived.thirdPartBranch,
      thirdPartAccountType: devolutionReceived.thirdPartAccountType,
      thirdPartAccountNumber: devolutionReceived.thirdPartAccountNumber,
      thirdPartDocument: devolutionReceived.thirdPartDocument,
      thirdPartPersonType: devolutionReceived.clientPersonType,
      thirdPartName: devolutionReceived.thirdPartName,
      thirdPartKey: devolutionReceived.thirdPartKey,
      thirdPartBankName: devolutionReceived.thirdPartBank.name,
      thirdPartBankIspb: devolutionReceived.thirdPartBank.ispb,
      description: devolutionReceived.description,
      state: devolutionReceived.state,
      createdAt: devolutionReceived.createdAt,
    });

    this.logger.info('Get devolution received by id response.', {
      devolutionReceived: response,
    });

    return response;
  }
}
