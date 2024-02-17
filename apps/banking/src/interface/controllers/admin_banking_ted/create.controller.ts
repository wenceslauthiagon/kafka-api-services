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
import { IsIsoStringDateFormat, AutoValidator } from '@zro/common';
import {
  AdminBankingAccount,
  AdminBankingAccountEntity,
  AdminBankingAccountRepository,
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import { Admin, AdminEntity } from '@zro/admin/domain';
import { CreateAdminBankingTedUseCase as UseCase } from '@zro/banking/application';
import {
  AdminBankingTedEventEmitterController,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type AdminId = Admin['id'];
type AdminBankingAccountId = AdminBankingAccount['id'];

type TCreateAdminBankingTedRequest = Pick<
  AdminBankingTed,
  'description' | 'value'
> & {
  adminId: AdminId;
  sourceId: AdminBankingAccountId;
  destinationId: AdminBankingAccountId;
};

export class CreateAdminBankingTedRequest
  extends AutoValidator
  implements TCreateAdminBankingTedRequest
{
  @IsUUID()
  id: string;

  @IsInt()
  adminId: AdminId;

  @IsUUID()
  sourceId: AdminBankingAccountId;

  @IsUUID()
  destinationId: AdminBankingAccountId;

  @IsInt()
  @IsPositive()
  value: number;

  @IsString()
  @MaxLength(255)
  description: string;

  constructor(props: TCreateAdminBankingTedRequest) {
    super(props);
  }
}

type TCreateAdminBankingTedResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export class CreateAdminBankingTedResponse
  extends AutoValidator
  implements TCreateAdminBankingTedResponse
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ')
  createdAt?: Date;

  constructor(props: TCreateAdminBankingTedResponse) {
    super(props);
  }
}

export class CreateAdminBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    adminBankingTedRepository: AdminBankingTedRepository,
    adminBankingAccountRepository: AdminBankingAccountRepository,
    eventEmitter: AdminBankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateAdminBankingTedController.name,
    });

    const adminBankingTedEventEmitter =
      new AdminBankingTedEventEmitterController(eventEmitter);

    this.usecase = new UseCase(
      this.logger,
      adminBankingTedRepository,
      adminBankingAccountRepository,
      adminBankingTedEventEmitter,
    );
  }

  async execute(
    request: CreateAdminBankingTedRequest,
  ): Promise<CreateAdminBankingTedResponse> {
    this.logger.debug('Create banking ted request.', { request });

    const { id, adminId, sourceId, destinationId, description, value } =
      request;

    const admin = new AdminEntity({ id: adminId });
    const source = new AdminBankingAccountEntity({ id: sourceId });
    const destination = new AdminBankingAccountEntity({ id: destinationId });

    const adminBankingTed = await this.usecase.execute(
      id,
      admin,
      source,
      destination,
      description,
      value,
    );

    const response = new CreateAdminBankingTedResponse({
      id: adminBankingTed.id,
      state: adminBankingTed.state,
      createdAt: adminBankingTed.createdAt,
    });

    this.logger.info('Created adminBankingTed response.', {
      adminBankingTed: response,
    });

    return response;
  }
}
