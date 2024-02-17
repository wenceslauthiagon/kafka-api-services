import { Logger } from 'winston';
import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  ForwardBankingTedUseCase as UseCase,
  BankingTedEvent,
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

type TForwardBankingTedRequest = Pick<BankingTedEvent, 'id'>;

export class ForwardBankingTedRequest
  extends AutoValidator
  implements TForwardBankingTedRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  constructor(props: TForwardBankingTedRequest) {
    super(props);
  }
}

type TForwardBankingTedResponse = Pick<
  BankingTed,
  'id' | 'state' | 'createdAt'
>;

export class ForwardBankingTedResponse
  extends AutoValidator
  implements TForwardBankingTedResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsEnum(BankingTedState)
  state: BankingTedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TForwardBankingTedResponse) {
    super(props);
  }
}

export class ForwardBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ForwardBankingTedController.name,
    });

    const bankingTedEventEmitter = new BankingTedEventEmitterController(
      bankingTedEmitter,
    );

    this.usecase = new UseCase(
      logger,
      bankingTedRepository,
      bankingTedEventEmitter,
    );
  }

  async execute(
    request: ForwardBankingTedRequest,
  ): Promise<ForwardBankingTedResponse> {
    const { id } = request;
    this.logger.debug('Forward ted by ID request.', { request });

    const bankingTed = await this.usecase.execute(id);

    if (!bankingTed) return null;

    const response = new ForwardBankingTedResponse({
      id: bankingTed.id,
      state: bankingTed.state,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Forward ted by ID response.', {
      bankingTed: response,
    });

    return response;
  }
}
