import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  ForwardAdminBankingTedUseCase as UseCase,
  AdminBankingTedEvent,
} from '@zro/banking/application';
import {
  AdminBankingTedEventEmitterController,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type TForwardAdminBankingTedRequest = Pick<AdminBankingTedEvent, 'id'>;

export class ForwardAdminBankingTedRequest
  extends AutoValidator
  implements TForwardAdminBankingTedRequest
{
  @IsUUID()
  id: string;

  constructor(props: TForwardAdminBankingTedRequest) {
    super(props);
  }
}

type TForwardAdminBankingTedResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export class ForwardAdminBankingTedResponse
  extends AutoValidator
  implements TForwardAdminBankingTedResponse
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TForwardAdminBankingTedResponse) {
    super(props);
  }
}

export class ForwardAdminBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: AdminBankingTedRepository,
    bankingTedEmitter: AdminBankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ForwardAdminBankingTedController.name,
    });

    const bankingTedEventEmitter = new AdminBankingTedEventEmitterController(
      bankingTedEmitter,
    );

    this.usecase = new UseCase(
      logger,
      bankingTedRepository,
      bankingTedEventEmitter,
    );
  }

  async execute(
    request: ForwardAdminBankingTedRequest,
  ): Promise<ForwardAdminBankingTedResponse> {
    const { id } = request;
    this.logger.debug('Forward admin ted by ID request.', { request });

    const bankingTed = await this.usecase.execute(id);

    if (!bankingTed) return null;

    const response = new ForwardAdminBankingTedResponse({
      id: bankingTed.id,
      state: bankingTed.state,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Forward admin ted by ID response.', {
      bankingTed: response,
    });

    return response;
  }
}
