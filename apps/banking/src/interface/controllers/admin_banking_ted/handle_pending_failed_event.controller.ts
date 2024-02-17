import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  HandlePendingFailedAdminBankingTedEventUseCase as UseCase,
  AdminBankingTedEvent,
} from '@zro/banking/application';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  AdminBankingTedEventEmitterController,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type THandlePendingFailedAdminBankingTedEventRequest = Pick<
  AdminBankingTedEvent,
  'id' | 'state'
>;

export class HandlePendingFailedAdminBankingTedEventRequest
  extends AutoValidator
  implements THandlePendingFailedAdminBankingTedEventRequest
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  constructor(props: THandlePendingFailedAdminBankingTedEventRequest) {
    super(props);
  }
}

type THandlePendingFailedAdminBankingTedEventResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingFailedAdminBankingTedEventResponse
  extends AutoValidator
  implements THandlePendingFailedAdminBankingTedEventResponse
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state!: AdminBankingTedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingFailedAdminBankingTedEventResponse) {
    super(props);
  }
}

export class HandlePendingFailedAdminBankingTedEventController {
  /**
   * Handler triggered when an error is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param bankingTedRepository AdminBankingTed repository.
   * @param eventEmitter AdminBankingTed event emitter.
   */
  constructor(
    private logger: Logger,
    bankingTedRepository: AdminBankingTedRepository,
    eventEmitter: AdminBankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedAdminBankingTedEventController.name,
    });

    const controllerEventEmitter = new AdminBankingTedEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      bankingTedRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandlePendingFailedAdminBankingTedEventRequest,
  ): Promise<HandlePendingFailedAdminBankingTedEventResponse> {
    const { id } = request;
    this.logger.debug('Handle pending failed event by ID request.', {
      request,
    });

    const bankingTed = await this.usecase.execute(id);

    if (!bankingTed) return null;

    const response = new HandlePendingFailedAdminBankingTedEventResponse({
      id: bankingTed.id,
      state: bankingTed.state,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Handle pending failed event by ID response.', {
      bankingTed: response,
    });

    return response;
  }
}
