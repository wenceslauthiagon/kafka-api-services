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
} from 'class-validator';
import {
  Pagination,
  PaginationEntity,
  PaginationRequest,
  AutoValidator,
  PaginationResponse,
  IsIsoStringDateFormat,
  Sort,
  PaginationSort,
  IsDateBeforeThan,
  IsDateAfterThan,
} from '@zro/common';
import {
  PixDevolutionReceived,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import { PersonDocumentType, User, UserEntity } from '@zro/users/domain';
import { Operation, Wallet, WalletEntity } from '@zro/operations/domain';
import { GetAllPixDevolutionReceivedUseCase as UseCase } from '@zro/pix-payments/application';

export enum GetAllPixDevolutionReceivedRequestSort {
  CREATED_AT = 'created_at',
}

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type ClientBankName = PixDevolutionReceived['clientBank']['name'];
type ClientBankIspb = PixDevolutionReceived['clientBank']['ispb'];
type ThirdPartBankName = PixDevolutionReceived['thirdPartBank']['name'];
type ThirdPartBankIspb = PixDevolutionReceived['thirdPartBank']['ispb'];

export type TGetAllPixDevolutionReceivedRequest = Pagination & {
  userId?: UserId;
  walletId?: WalletId;
  createdAtPeriodStart?: Date;
  createdAtPeriodEnd?: Date;
  endToEndId?: string;
  clientDocument?: string;
  states?: PixDevolutionReceivedState[];
};

export class GetAllPixDevolutionReceivedRequest
  extends PaginationRequest
  implements TGetAllPixDevolutionReceivedRequest
{
  @IsOptional()
  @Sort(GetAllPixDevolutionReceivedRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsUUID(4)
  userId?: UserId;

  @IsOptional()
  @IsUUID(4)
  walletId?: WalletId;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtPeriodStart',
  })
  @IsDateBeforeThan('createdAtPeriodEnd', false, {
    message: 'createdAtPeriodStart must be before than createdAtPeriodEnd',
  })
  createdAtPeriodStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtPeriodEnd',
  })
  @IsDateAfterThan('createdAtPeriodStart', false, {
    message: 'createdAtPeriodEnd must be after than createdAtPeriodStart',
  })
  createdAtPeriodEnd?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientDocument?: string;

  @IsOptional()
  @IsEnum(PixDevolutionReceivedState, { each: true })
  states?: PixDevolutionReceivedState[];

  constructor(props: TGetAllPixDevolutionReceivedRequest) {
    super(props);
  }
}

type TGetAllPixDevolutionReceivedResponseItem = Pick<
  PixDevolutionReceived,
  | 'id'
  | 'amount'
  | 'description'
  | 'state'
  | 'createdAt'
  | 'endToEndId'
  | 'txId'
  | 'clientName'
  | 'clientPersonType'
  | 'clientDocument'
  | 'clientAccountNumber'
  | 'clientBranch'
  | 'thirdPartName'
  | 'thirdPartPersonType'
  | 'thirdPartDocument'
  | 'thirdPartAccountNumber'
  | 'thirdPartBranch'
> & {
  userId: UserId;
  operationId: OperationId;
  clientBankName: ClientBankName;
  clientBankIspb: ClientBankIspb;
  thirdPartBankName: ThirdPartBankName;
  thirdPartBankIspb: ThirdPartBankIspb;
};

export class GetAllPixDevolutionReceivedResponseItem
  extends AutoValidator
  implements TGetAllPixDevolutionReceivedResponseItem
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  operationId: OperationId;

  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endToEndId: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  txId: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  thirdPartName: string;

  @IsString()
  @IsOptional()
  @Length(11, 14)
  thirdPartDocument: string;

  @IsString()
  @MaxLength(255)
  thirdPartBankName: ThirdPartBankName;

  @IsString()
  @MaxLength(255)
  thirdPartBankIspb: ThirdPartBankIspb;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  thirdPartBranch: string;

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

  @IsString()
  @MaxLength(255)
  clientBankName: ClientBankName;

  @IsString()
  @MaxLength(255)
  clientBankIspb: ClientBankIspb;

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

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  @IsEnum(PixDevolutionReceivedState)
  state: PixDevolutionReceivedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllPixDevolutionReceivedResponseItem) {
    super(props);
  }
}

export class GetAllPixDevolutionReceivedResponse extends PaginationResponse<GetAllPixDevolutionReceivedResponseItem> {}

export class GetAllPixDevolutionReceivedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    depositReceivedRepository: PixDevolutionReceivedRepository,
  ) {
    this.logger = logger.child({
      context: GetAllPixDevolutionReceivedController.name,
    });

    this.usecase = new UseCase(this.logger, depositReceivedRepository);
  }

  async execute(
    request: GetAllPixDevolutionReceivedRequest,
  ): Promise<GetAllPixDevolutionReceivedResponse> {
    this.logger.debug('GetAll Devolutions received.', { request });

    const {
      order,
      page,
      pageSize,
      sort,
      userId,
      walletId,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
      states,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const user = userId && new UserEntity({ uuid: userId });
    const wallet = walletId && new WalletEntity({ uuid: walletId });

    const results = await this.usecase.execute(
      pagination,
      user,
      wallet,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
      states,
    );

    const data = results.data.map(
      (devolution) =>
        new GetAllPixDevolutionReceivedResponseItem({
          id: devolution.id,
          operationId: devolution.operation.id,
          endToEndId: devolution.endToEndId,
          txId: devolution.txId,
          state: devolution.state,
          userId: devolution.user.uuid,
          description: devolution.description,
          amount: devolution.amount,
          clientName: devolution.clientName,
          clientPersonType: devolution.clientPersonType,
          clientAccountNumber: devolution.clientAccountNumber,
          clientDocument: devolution.clientDocument,
          clientBranch: devolution.clientBranch,
          clientBankName: devolution.clientBank.name,
          clientBankIspb: devolution.clientBank.ispb,
          thirdPartName: devolution.thirdPartName,
          thirdPartPersonType: devolution.thirdPartPersonType,
          thirdPartDocument: devolution.thirdPartDocument,
          thirdPartAccountNumber: devolution.thirdPartAccountNumber,
          thirdPartBranch: devolution.thirdPartBranch,
          thirdPartBankName: devolution.thirdPartBank.name,
          thirdPartBankIspb: devolution.thirdPartBank.ispb,
          createdAt: devolution.createdAt,
        }),
    );

    const response = new GetAllPixDevolutionReceivedResponse({
      ...results,
      data,
    });

    this.logger.info('GetAll devolutions received response.', {
      devolutionReceived: response,
    });

    return response;
  }
}
