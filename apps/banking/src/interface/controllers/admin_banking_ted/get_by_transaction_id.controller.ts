import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsObject,
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
import { GetAdminBankingTedByTransactionIdUseCase as UseCase } from '@zro/banking/application';

type TGetAdminBankingTedByTransactionIdRequest = Pick<
  AdminBankingTed,
  'transactionId'
>;

export class GetAdminBankingTedByTransactionIdRequest
  extends AutoValidator
  implements TGetAdminBankingTedByTransactionIdRequest
{
  @IsUUID(4)
  transactionId: string;

  constructor(props: TGetAdminBankingTedByTransactionIdRequest) {
    super(props);
  }
}

type TGetAdminBankingTedByTransactionIdResponse = Pick<
  AdminBankingTed,
  | 'id'
  | 'source'
  | 'destination'
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
>;

export class GetAdminBankingTedByTransactionIdResponse
  extends AutoValidator
  implements TGetAdminBankingTedByTransactionIdResponse
{
  @IsUUID()
  id: string;

  @IsObject()
  source: AdminBankingAccount;

  @IsObject()
  destination: AdminBankingAccount;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsInt()
  @IsPositive()
  value: number;

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

  constructor(props: TGetAdminBankingTedByTransactionIdResponse) {
    super(props);
  }
}

export class GetAdminBankingTedByTransactionIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    repository: AdminBankingTedRepository,
  ) {
    this.logger = logger.child({
      context: GetAdminBankingTedByTransactionIdController.name,
    });

    this.usecase = new UseCase(this.logger, repository);
  }

  async execute(
    request: GetAdminBankingTedByTransactionIdRequest,
  ): Promise<GetAdminBankingTedByTransactionIdResponse> {
    this.logger.debug('Getting adminBankingTed by transactionId request.', {
      request,
    });

    const { transactionId } = request;

    const adminBankingTed = await this.usecase.execute(transactionId);

    if (!adminBankingTed) return null;

    const response = new GetAdminBankingTedByTransactionIdResponse({
      id: adminBankingTed.id,
      source: adminBankingTed.source,
      destination: adminBankingTed.destination,
      state: adminBankingTed.state,
      description: adminBankingTed.description,
      value: adminBankingTed.value,
      transactionId: adminBankingTed.transactionId,
      confirmedAt: adminBankingTed.confirmedAt,
      failedAt: adminBankingTed.failedAt,
      forwardedAt: adminBankingTed.forwardedAt,
      failureCode: adminBankingTed.failureCode,
      failureMessage: adminBankingTed.failureMessage,
      createdAt: adminBankingTed.createdAt,
      updatedAt: adminBankingTed.updatedAt,
    });

    this.logger.info('Getting adminBankingTed by transactionId response.', {
      adminBankingTed: response,
    });

    return response;
  }
}
