import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
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
  AdminBankingAccount,
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
  TGetAdminBankingTedFilter,
} from '@zro/banking/domain';
import { Admin } from '@zro/admin/domain';
import { GetAllAdminBankingTedUseCase as UseCase } from '@zro/banking/application';

export enum GetAllAdminBankingTedRequestSort {
  ID = 'id',
  CREATED_AT = 'created_at',
  CONFIRMED_AT = 'confirmed_at',
  FAILED_AT = 'failed_at',
}

type AdminBankingAccountId = AdminBankingAccount['id'];
type AdminId = Admin['id'];

export type TGetAllAdminBankingTedRequest = Pagination &
  TGetAdminBankingTedFilter & {
    sourceId?: AdminBankingAccountId;
    destinationId?: AdminBankingAccountId;
  };

export class GetAllAdminBankingTedRequest
  extends PaginationRequest
  implements TGetAllAdminBankingTedRequest
{
  @IsOptional()
  @Sort(GetAllAdminBankingTedRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsUUID(4)
  sourceId?: AdminBankingAccountId;

  @IsOptional()
  @IsUUID(4)
  destinationId?: AdminBankingAccountId;

  @IsOptional()
  @IsEnum(AdminBankingTedState)
  state?: AdminBankingTedState;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsUUID(4)
  transactionId?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtStart',
  })
  @IsDateBeforeThan('createdAtEnd', true, {
    message: 'createdAtStart must be before than createdAtEnd',
  })
  createdAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date createdAtEnd',
  })
  @IsDateAfterThan('createdAtStart', true, {
    message: 'createdAtEnd must be after than createdAtStart',
  })
  createdAtEnd?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date confirmedAtStart',
  })
  @IsDateBeforeThan('confirmedAtEnd', true, {
    message: 'confirmedAtStart must be before than confirmedAtEnd',
  })
  confirmedAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date confirmedAtEnd',
  })
  @IsDateAfterThan('confirmedAtStart', true, {
    message: 'confirmedAtEnd must be after than confirmedAtStart',
  })
  confirmedAtEnd?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date failedAtStart',
  })
  @IsDateBeforeThan('failedAtEnd', true, {
    message: 'failedAtStart must be before than failedAtEnd',
  })
  failedAtStart?: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date failedAtEnd',
  })
  @IsDateAfterThan('failedAtStart', true, {
    message: 'failedAtEnd must be after than failedAtStart',
  })
  failedAtEnd?: Date;

  constructor(props: TGetAllAdminBankingTedRequest) {
    super(props);
  }
}

type TGetAllAdminBankingTedResponseItem = Pick<
  AdminBankingTed,
  | 'id'
  | 'state'
  | 'transactionId'
  | 'value'
  | 'description'
  | 'failureCode'
  | 'failureMessage'
  | 'confirmedAt'
  | 'forwardedAt'
  | 'failedAt'
  | 'createdAt'
> & {
  sourceId: AdminBankingAccountId;
  destinationId: AdminBankingAccountId;
  createdByAdminId: AdminId;
  updatedByAdminId: AdminId;
};

export class GetAllAdminBankingTedResponseItem
  extends AutoValidator
  implements TGetAllAdminBankingTedResponseItem
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  sourceId: AdminBankingAccountId;

  @IsUUID(4)
  destinationId: AdminBankingAccountId;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  @IsOptional()
  @IsUUID(4)
  transactionId?: string;

  @IsInt()
  @IsPositive()
  value: number;

  @IsString()
  description: string;

  @IsInt()
  @IsPositive()
  createdByAdminId: AdminId;

  @IsInt()
  @IsPositive()
  updatedByAdminId: AdminId;

  @IsOptional()
  @IsString()
  failureCode?: string;

  @IsOptional()
  @IsString()
  failureMessage?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  confirmedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  forwardedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  failedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  createdAt?: Date;

  constructor(props: TGetAllAdminBankingTedResponseItem) {
    super(props);
  }
}

export class GetAllAdminBankingTedResponse extends PaginationResponse<GetAllAdminBankingTedResponseItem> {}

export class GetAllAdminBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    repository: AdminBankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetAllAdminBankingTedController.name,
    });
    this.usecase = new UseCase(this.logger, repository);
  }

  async execute(
    request: GetAllAdminBankingTedRequest,
  ): Promise<GetAllAdminBankingTedResponse> {
    this.logger.debug('GetAll AdminBankingTeds.', { request });

    const {
      order,
      sort,
      page,
      pageSize,
      sourceId,
      destinationId,
      state,
      transactionId,
      description,
      confirmedAtStart,
      confirmedAtEnd,
      failedAtStart,
      failedAtEnd,
      createdAtStart,
      createdAtEnd,
    } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });
    const filter: TGetAdminBankingTedFilter = {
      ...(sourceId && { sourceId }),
      ...(destinationId && { destinationId }),
      ...(state && { state }),
      ...(transactionId && { transactionId }),
      ...(description && { description }),
      ...(confirmedAtStart && { confirmedAtStart }),
      ...(confirmedAtEnd && { confirmedAtEnd }),
      ...(failedAtStart && { failedAtStart }),
      ...(failedAtEnd && { failedAtEnd }),
      ...(createdAtStart && { createdAtStart }),
      ...(createdAtEnd && { createdAtEnd }),
    };

    const results = await this.usecase.execute(pagination, filter);

    const data = results.data.map(
      (adminBankingTed) =>
        new GetAllAdminBankingTedResponseItem({
          id: adminBankingTed.id,
          sourceId: adminBankingTed.source.id,
          destinationId: adminBankingTed.destination.id,
          state: adminBankingTed.state,
          transactionId: adminBankingTed.transactionId,
          description: adminBankingTed.description,
          value: adminBankingTed.value,
          createdByAdminId: adminBankingTed.createdByAdmin.id,
          updatedByAdminId: adminBankingTed.updatedByAdmin.id,
          failureCode: adminBankingTed.failureCode,
          failureMessage: adminBankingTed.failureMessage,
          createdAt: adminBankingTed.createdAt,
          confirmedAt: adminBankingTed.confirmedAt,
          forwardedAt: adminBankingTed.forwardedAt,
          failedAt: adminBankingTed.failedAt,
        }),
    );

    const response = new GetAllAdminBankingTedResponse({ ...results, data });

    this.logger.debug('GetAll adminBankingTeds response.', {
      adminBankingTeds: response,
    });

    return response;
  }
}
