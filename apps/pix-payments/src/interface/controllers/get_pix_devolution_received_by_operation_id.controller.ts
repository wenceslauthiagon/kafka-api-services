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
  Payment,
  PaymentRepository,
  PixDevolutionReceived,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import { GetPixDevolutionReceivedByOperationIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];
type PaymentId = Payment['id'];

type TGetPixDevolutionReceivedByOperationIdRequest = {
  userId?: UserId;
  walletId?: WalletId;
  operationId: OperationId;
};

export class GetPixDevolutionReceivedByOperationIdRequest
  extends AutoValidator
  implements TGetPixDevolutionReceivedByOperationIdRequest
{
  @IsUUID(4)
  @IsOptional()
  userId?: UserId;

  @IsUUID(4)
  @IsOptional()
  walletId?: WalletId;

  @IsUUID(4)
  operationId: OperationId;

  constructor(props: TGetPixDevolutionReceivedByOperationIdRequest) {
    super(props);
  }
}

type TGetPixDevolutionReceivedByOperationIdResponse = Pick<
  PixDevolutionReceived,
  | 'id'
  | 'state'
  | 'amount'
  | 'endToEndId'
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
> & { userId: UserId; operationId: OperationId; paymentId?: PaymentId };

export class GetPixDevolutionReceivedByOperationIdResponse
  extends AutoValidator
  implements TGetPixDevolutionReceivedByOperationIdResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixDevolutionReceivedState)
  state: PixDevolutionReceivedState;

  @IsInt()
  @Min(0)
  amount: number;

  @IsString()
  @MaxLength(255)
  endToEndId: string;

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

  @IsEnum(AccountType)
  thirdPartAccountType: AccountType;

  @IsString()
  @MaxLength(255)
  thirdPartAccountNumber: string;

  @IsOptional()
  @IsEnum(PersonDocumentType)
  thirdPartPersonType: PersonDocumentType;

  @IsString()
  @IsOptional()
  @MaxLength(77)
  thirdPartKey: string;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  operationId: OperationId;

  @IsUUID(4)
  @IsOptional()
  paymentId?: PaymentId;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetPixDevolutionReceivedByOperationIdResponse) {
    super(props);
  }
}

export class GetPixDevolutionReceivedByOperationIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    paymentRepository: PaymentRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDevolutionReceivedByOperationIdController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      devolutionReceivedRepository,
      paymentRepository,
    );
  }

  async execute(
    request: GetPixDevolutionReceivedByOperationIdRequest,
  ): Promise<GetPixDevolutionReceivedByOperationIdResponse> {
    this.logger.debug('Get devolutionReceived by operation id request.', {
      request,
    });
    const { operationId, userId, walletId } = request;

    const user = userId && new UserEntity({ uuid: userId });
    const wallet = walletId && new WalletEntity({ uuid: walletId });
    const operation = new OperationEntity({ id: operationId });

    const devolutionReceived = await this.usecase.execute(
      operation,
      user,
      wallet,
    );

    if (!devolutionReceived) return null;

    const response = new GetPixDevolutionReceivedByOperationIdResponse({
      id: devolutionReceived.id,
      state: devolutionReceived.state,
      amount: devolutionReceived.amount,
      endToEndId: devolutionReceived.endToEndId,
      clientBank: devolutionReceived.clientBank,
      clientBranch: devolutionReceived.clientBranch,
      clientAccountNumber: devolutionReceived.clientAccountNumber,
      clientPersonType: devolutionReceived.clientPersonType,
      clientDocument: devolutionReceived.clientDocument,
      clientName: devolutionReceived.clientName,
      clientKey: devolutionReceived.clientKey,
      thirdPartBank: devolutionReceived.thirdPartBank,
      thirdPartBranch: devolutionReceived.thirdPartBranch,
      thirdPartAccountType: devolutionReceived.thirdPartAccountType,
      thirdPartAccountNumber: devolutionReceived.thirdPartAccountNumber,
      thirdPartPersonType: devolutionReceived.thirdPartPersonType,
      thirdPartDocument: devolutionReceived.thirdPartDocument,
      thirdPartName: devolutionReceived.thirdPartName,
      thirdPartKey: devolutionReceived.thirdPartKey,
      userId: devolutionReceived.user.uuid,
      operationId: devolutionReceived.operation.id,
      paymentId: devolutionReceived.payment?.id,
      createdAt: devolutionReceived.createdAt,
    });

    this.logger.info('Get devolutionReceived by operation id response.', {
      devolutionReceived: response,
    });

    return response;
  }
}
