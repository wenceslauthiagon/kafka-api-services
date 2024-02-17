import { Logger } from 'winston';
import { IsEnum, IsInt, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  HandlePendingFailedBankingTedEventUseCase as UseCase,
  BankingTedEvent,
  OperationService,
} from '@zro/banking/application';
import {
  BankingTed,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import {
  BankingTedEventEmitterController,
  BankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type UserId = User['uuid'];

type THandlePendingFailedBankingTedEventRequest = Pick<
  BankingTedEvent,
  'id' | 'state'
> & { userId?: UserId };

export class HandlePendingFailedBankingTedEventRequest
  extends AutoValidator
  implements THandlePendingFailedBankingTedEventRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsEnum(BankingTedState)
  state: BankingTedState;

  @IsUUID(4)
  userId: UserId;

  constructor(props: THandlePendingFailedBankingTedEventRequest) {
    super(props);
  }
}

type THandlePendingFailedBankingTedEventResponse = Pick<
  BankingTed,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingFailedBankingTedEventResponse
  extends AutoValidator
  implements THandlePendingFailedBankingTedEventResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsEnum(BankingTedState)
  state!: BankingTedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingFailedBankingTedEventResponse) {
    super(props);
  }
}

export class HandlePendingFailedBankingTedEventController {
  /**
   * Handler triggered when an error is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param bankingTedRepository BankingTed repository.
   * @param eventEmitter BankingTed event emitter.
   */
  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
    eventEmitter: BankingTedEventEmitterControllerInterface,
    operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedBankingTedEventController.name,
    });

    const controllerEventEmitter = new BankingTedEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      bankingTedRepository,
      controllerEventEmitter,
      operationService,
    );
  }

  async execute(
    request: HandlePendingFailedBankingTedEventRequest,
  ): Promise<HandlePendingFailedBankingTedEventResponse> {
    const { id } = request;
    this.logger.debug('Handle pending failed event by ID request.', {
      request,
    });

    const bankingTed = await this.usecase.execute(id);

    if (!bankingTed) return null;

    const response = new HandlePendingFailedBankingTedEventResponse({
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
