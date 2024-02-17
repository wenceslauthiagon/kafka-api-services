import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
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
import { User, UserEntity } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import {
  WarningPixDeposit,
  WarningPixDepositRepository,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import { GetAllWarningPixDepositUseCase as UseCase } from '@zro/pix-payments/application';

export enum GetAllWarningPixDepositRequestSort {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  STATE = 'state',
}

type UserId = User['uuid'];
type OperationId = Operation['id'];

export type TGetAllWarningPixDepositRequest = Pagination & {
  userId?: UserId;
  transactionTag?: string;
  operationId?: OperationId;
  createdAtPeriodStart?: Date;
  createdAtPeriodEnd?: Date;
  updatedAtPeriodStart?: Date;
  updatedAtPeriodEnd?: Date;
};

export class GetAllWarningPixDepositRequest
  extends PaginationRequest
  implements TGetAllWarningPixDepositRequest
{
  @IsOptional()
  @Sort(GetAllWarningPixDepositRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsUUID(4)
  userId?: UserId;

  @IsOptional()
  @IsString()
  transactionTag?: string;

  @IsOptional()
  @IsUUID(4)
  operationId?: OperationId;

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
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updatedAtPeriodStart',
  })
  @IsDateBeforeThan('updatedAtPeriodEnd', false, {
    message: 'updatedAtPeriodStart must be before than updatedAtPeriodEnd',
  })
  updatedAtPeriodStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date updatedAtPeriodEnd',
  })
  @IsDateAfterThan('updatedAtPeriodStart', false, {
    message: 'updatedAtPeriodEnd must be after than updatedAtPeriodStart',
  })
  updatedAtPeriodEnd?: Date;

  constructor(props: TGetAllWarningPixDepositRequest) {
    super(props);
  }
}

type TGetAllWarningPixDepositResponseItem = Pick<
  WarningPixDeposit,
  | 'id'
  | 'state'
  | 'transactionTag'
  | 'rejectedReason'
  | 'createdAt'
  | 'updatedAt'
> & { operationId?: OperationId };

export class GetAllWarningPixDepositResponseItem
  extends AutoValidator
  implements TGetAllWarningPixDepositResponseItem
{
  @IsUUID(4)
  id!: string;

  @IsOptional()
  @IsUUID(4)
  operationId?: OperationId;

  @IsString()
  transactionTag: string;

  @IsEnum(WarningPixDepositState)
  state: WarningPixDepositState;

  @IsOptional()
  @IsString()
  rejectedReason?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  updatedAt: Date;

  constructor(props: TGetAllWarningPixDepositResponseItem) {
    super(props);
  }
}

export class GetAllWarningPixDepositResponse extends PaginationResponse<GetAllWarningPixDepositResponseItem> {}

export class GetAllWarningPixDepositController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    warningPixDepositRepository: WarningPixDepositRepository,
  ) {
    this.logger = logger.child({
      context: GetAllWarningPixDepositController.name,
    });
    this.usecase = new UseCase(this.logger, warningPixDepositRepository);
  }

  async execute(
    request: GetAllWarningPixDepositRequest,
  ): Promise<GetAllWarningPixDepositResponse> {
    this.logger.debug('GetAll Warning Deposits.', { request });

    const {
      userId,
      transactionTag,
      operationId,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      updatedAtPeriodStart,
      updatedAtPeriodEnd,
      order,
      page,
      pageSize,
      sort,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const user = userId && new UserEntity({ uuid: userId });

    const results = await this.usecase.execute(
      pagination,
      user,
      transactionTag,
      operationId,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      updatedAtPeriodStart,
      updatedAtPeriodEnd,
    );

    const data = results.data.map(
      (warningPixDeposit) =>
        new GetAllWarningPixDepositResponseItem({
          id: warningPixDeposit.id,
          rejectedReason: warningPixDeposit.rejectedReason,
          transactionTag: warningPixDeposit.transactionTag,
          operationId: warningPixDeposit.operation?.id,
          state: warningPixDeposit.state,
          createdAt: warningPixDeposit.createdAt,
          updatedAt: warningPixDeposit.updatedAt,
        }),
    );

    const response = new GetAllWarningPixDepositResponse({ ...results, data });

    this.logger.info('GetAll Warning Deposits response.', {
      warningPixDeposits: response,
    });

    return response;
  }
}
