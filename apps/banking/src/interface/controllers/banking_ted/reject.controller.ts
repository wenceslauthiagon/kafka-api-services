import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  RejectBankingTedUseCase as UseCase,
  BankingTedEvent,
  OperationService,
} from '@zro/banking/application';
import {
  BankingTed,
  BankingTedFailure,
  BankingTedFailureRepository,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import {
  BankingTedEventEmitterController,
  BankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type TRejectBankingTedRequest = Pick<BankingTedEvent, 'id'> & {
  code?: BankingTedFailure['failureCode'];
  message?: BankingTedFailure['failureMessage'];
};

export class RejectBankingTedRequest
  extends AutoValidator
  implements TRejectBankingTedRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsOptional()
  @IsString()
  code?: BankingTedFailure['failureCode'];

  @IsOptional()
  @IsString()
  message?: BankingTedFailure['failureMessage'];

  constructor(props: TRejectBankingTedRequest) {
    super(props);
  }
}

type TRejectBankingTedResponse = Pick<BankingTed, 'id' | 'state' | 'createdAt'>;

export class RejectBankingTedResponse
  extends AutoValidator
  implements TRejectBankingTedResponse
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

  constructor(props: TRejectBankingTedResponse) {
    super(props);
  }
}

export class RejectBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
    bankingTedFailureRepository: BankingTedFailureRepository,
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
    operationService: OperationService,
    bankingTedOperationCurrencyTag: string,
    bankingTedFailureOperationTransactionTag: string,
    bankingTedFailureOperationDescription: string,
  ) {
    this.logger = logger.child({
      context: RejectBankingTedController.name,
    });

    const bankingTedEventEmitter = new BankingTedEventEmitterController(
      bankingTedEmitter,
    );

    this.usecase = new UseCase(
      logger,
      bankingTedRepository,
      bankingTedFailureRepository,
      bankingTedEventEmitter,
      operationService,
      bankingTedOperationCurrencyTag,
      bankingTedFailureOperationTransactionTag,
      bankingTedFailureOperationDescription,
    );
  }

  async execute(
    request: RejectBankingTedRequest,
  ): Promise<RejectBankingTedResponse> {
    const { id, code, message } = request;
    this.logger.debug('Reject bankingTed by ID request.', { request });

    const bankingTed = await this.usecase.execute(id, code, message);

    if (!bankingTed) return null;

    const response = new RejectBankingTedResponse({
      id: bankingTed.id,
      state: bankingTed.state,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Reject bankingTed by ID response.', {
      bankingTed: response,
    });

    return response;
  }
}
