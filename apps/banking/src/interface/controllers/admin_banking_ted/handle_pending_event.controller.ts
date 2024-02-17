import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  AdminBankingAccountRepository,
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  HandlePendingAdminBankingTedEventUseCase as UseCase,
  AdminBankingTedEvent,
  BankingTedGateway,
} from '@zro/banking/application';
import {
  AdminBankingTedEventEmitterController,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type THandlePendingAdminBankingTedEventRequest = Pick<
  AdminBankingTedEvent,
  'id' | 'state'
>;

export class HandlePendingAdminBankingTedEventRequest
  extends AutoValidator
  implements THandlePendingAdminBankingTedEventRequest
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  constructor(props: THandlePendingAdminBankingTedEventRequest) {
    super(props);
  }
}

type THandlePendingAdminBankingTedEventResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingAdminBankingTedEventResponse
  extends AutoValidator
  implements THandlePendingAdminBankingTedEventResponse
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: THandlePendingAdminBankingTedEventResponse) {
    super(props);
  }
}

export class HandlePendingAdminBankingTedEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    adminBankingAccountRepository: AdminBankingAccountRepository,
    adminBankingTedRepository: AdminBankingTedRepository,
    pspGateway: BankingTedGateway,
    adminBankingTedEmitter: AdminBankingTedEventEmitterControllerInterface,
    adminBankingTedCallbackUrl: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingAdminBankingTedEventController.name,
    });

    const adminBankingTedEventEmitter =
      new AdminBankingTedEventEmitterController(adminBankingTedEmitter);

    this.usecase = new UseCase(
      logger,
      adminBankingTedRepository,
      adminBankingAccountRepository,
      pspGateway,
      adminBankingTedEventEmitter,
      adminBankingTedCallbackUrl,
    );
  }

  async execute(
    request: HandlePendingAdminBankingTedEventRequest,
  ): Promise<HandlePendingAdminBankingTedEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const adminBankingTed = await this.usecase.execute(id);

    if (!adminBankingTed) return null;

    const response = new HandlePendingAdminBankingTedEventResponse({
      id: adminBankingTed.id,
      state: adminBankingTed.state,
      createdAt: adminBankingTed.createdAt,
    });

    this.logger.info('Handle pending event by ID response.', {
      adminBankingTed: response,
    });

    return response;
  }
}
