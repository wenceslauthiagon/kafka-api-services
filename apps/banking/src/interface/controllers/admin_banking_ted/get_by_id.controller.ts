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
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  AdminBankingAccount,
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import { Admin } from '@zro/admin/domain';
import { GetAdminBankingTedByIdUseCase as UseCase } from '@zro/banking/application';

type AdminBankingAccountId = AdminBankingAccount['id'];
type AdminId = Admin['id'];
type TGetAdminBankingTedByIdRequest = Pick<AdminBankingTed, 'id'>;

export class GetAdminBankingTedByIdRequest
  extends AutoValidator
  implements TGetAdminBankingTedByIdRequest
{
  @IsUUID()
  id: string;

  constructor(props: TGetAdminBankingTedByIdRequest) {
    super(props);
  }
}

type TGetAdminBankingTedByIdResponse = Pick<
  AdminBankingTed,
  | 'id'
  | 'state'
  | 'description'
  | 'value'
  | 'transactionId'
  | 'confirmedAt'
  | 'failedAt'
  | 'forwardedAt'
  | 'failureCode'
  | 'failureMessage'
  | 'createdAt'
  | 'updatedAt'
> & {
  sourceId: AdminBankingAccountId;
  destinationId: AdminBankingAccountId;
  createdByAdminId: AdminId;
  updatedByAdminId: AdminId;
};

export class GetAdminBankingTedByIdResponse
  extends AutoValidator
  implements TGetAdminBankingTedByIdResponse
{
  @IsUUID()
  id: string;

  @IsUUID()
  sourceId: AdminBankingAccountId;

  @IsUUID()
  destinationId: AdminBankingAccountId;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsInt()
  @IsPositive()
  value: number;

  @IsInt()
  @IsPositive()
  createdByAdminId: AdminId;

  @IsInt()
  @IsPositive()
  updatedByAdminId: AdminId;

  @IsUUID(4)
  @IsOptional()
  transactionId?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  confirmedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  failedAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  forwardedAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  failureCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  failureMessage?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  createdAt?: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  @IsOptional()
  updatedAt?: Date;

  constructor(props: TGetAdminBankingTedByIdResponse) {
    super(props);
  }
}

export class GetAdminBankingTedByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    repository: AdminBankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetAdminBankingTedByIdController.name,
    });

    this.usecase = new UseCase(this.logger, repository);
  }

  async execute(
    request: GetAdminBankingTedByIdRequest,
  ): Promise<GetAdminBankingTedByIdResponse> {
    this.logger.debug('Getting admin banking Ted by id request.', { request });

    const { id } = request;

    const adminBankingTed = await this.usecase.execute(id);

    if (!adminBankingTed) return null;

    const response = new GetAdminBankingTedByIdResponse({
      id: adminBankingTed.id,
      sourceId: adminBankingTed.source.id,
      destinationId: adminBankingTed.destination.id,
      state: adminBankingTed.state,
      description: adminBankingTed.description,
      value: adminBankingTed.value,
      createdByAdminId: adminBankingTed.createdByAdmin.id,
      updatedByAdminId: adminBankingTed.updatedByAdmin.id,
      transactionId: adminBankingTed.transactionId,
      confirmedAt: adminBankingTed.confirmedAt,
      failedAt: adminBankingTed.failedAt,
      forwardedAt: adminBankingTed.forwardedAt,
      failureCode: adminBankingTed.failureCode,
      failureMessage: adminBankingTed.failureMessage,
      createdAt: adminBankingTed.createdAt,
      updatedAt: adminBankingTed.updatedAt,
    });

    this.logger.info('Getting adminBankingTed by id response.', {
      adminBankingTed: response,
    });

    return response;
  }
}
