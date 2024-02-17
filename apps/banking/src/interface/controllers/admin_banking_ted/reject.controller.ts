import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { RejectAdminBankingTedUseCase as UseCase } from '@zro/banking/application';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  AdminBankingTedEventEmitterController,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type TRejectAdminBankingTedRequest = Pick<
  AdminBankingTed,
  'id' | 'failureCode' | 'failureMessage'
>;

export class RejectAdminBankingTedRequest
  extends AutoValidator
  implements TRejectAdminBankingTedRequest
{
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  failureCode?: string;

  @IsOptional()
  @IsString()
  failureMessage?: string;

  constructor(props: TRejectAdminBankingTedRequest) {
    super(props);
  }
}

type TRejectAdminBankingTedResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export class RejectAdminBankingTedResponse
  extends AutoValidator
  implements TRejectAdminBankingTedResponse
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TRejectAdminBankingTedResponse) {
    super(props);
  }
}

export class RejectAdminBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    adminBankingTedRepository: AdminBankingTedRepository,
    adminBankingTedEmitter: AdminBankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: RejectAdminBankingTedController.name,
    });

    const adminBankingTedEventEmitter =
      new AdminBankingTedEventEmitterController(adminBankingTedEmitter);

    this.usecase = new UseCase(
      logger,
      adminBankingTedRepository,
      adminBankingTedEventEmitter,
    );
  }

  async execute(
    request: RejectAdminBankingTedRequest,
  ): Promise<RejectAdminBankingTedResponse> {
    const { id, failureCode, failureMessage } = request;
    this.logger.debug('Reject adminBankingTed by ID request.', { request });

    const adminBankingTed = await this.usecase.execute(
      id,
      failureCode,
      failureMessage,
    );

    if (!adminBankingTed) return null;

    const response = new RejectAdminBankingTedResponse({
      id: adminBankingTed.id,
      state: adminBankingTed.state,
      createdAt: adminBankingTed.createdAt,
    });

    this.logger.info('Reject adminBankingTed by ID response.', {
      adminBankingTed: response,
    });

    return response;
  }
}
