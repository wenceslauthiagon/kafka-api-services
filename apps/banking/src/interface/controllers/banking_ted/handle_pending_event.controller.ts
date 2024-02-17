import { Logger } from 'winston';
import { IsEnum, IsInt, IsPositive, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet, WalletEntity } from '@zro/operations/domain';
import {
  HandlePendingBankingTedEventUseCase as UseCase,
  OperationService,
  UserService,
  BankingTedEvent,
  BankingTedGateway,
} from '@zro/banking/application';
import {
  BankingTed,
  BankingTedReceivedRepository,
  BankingTedRepository,
  BankingTedState,
  BankTedRepository,
  BankingContactRepository,
  BankingAccountContactRepository,
} from '@zro/banking/domain';
import {
  BankingTedEventEmitterController,
  BankingTedEventEmitterControllerInterface,
  BankingTedReceivedEventEmitterController,
  BankingTedReceivedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type THandlePendingBankingTedEventRequest = Pick<
  BankingTedEvent,
  'id' | 'state'
> & { userId: UserId; walletId: WalletId };

export class HandlePendingBankingTedEventRequest
  extends AutoValidator
  implements THandlePendingBankingTedEventRequest
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsEnum(BankingTedState)
  state: BankingTedState;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: THandlePendingBankingTedEventRequest) {
    super(props);
  }
}

type THandlePendingBankingTedEventResponse = Pick<
  BankingTed,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingBankingTedEventResponse
  extends AutoValidator
  implements THandlePendingBankingTedEventResponse
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

  constructor(props: THandlePendingBankingTedEventResponse) {
    super(props);
  }
}

export class HandlePendingBankingTedEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
    bankTedRepository: BankTedRepository,
    bankingTedReceivedRepository: BankingTedReceivedRepository,
    bankingContactRepository: BankingContactRepository,
    bankingAccountContactRepository: BankingAccountContactRepository,
    pspGateway: BankingTedGateway,
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
    bankingTedReceivedEmitter: BankingTedReceivedEventEmitterControllerInterface,
    operationService: OperationService,
    userService: UserService,
    bankingTedOperationCurrencyTag: string,
    bankingTedOperationTedP2PTransactionTag: string,
    bankingTedOperationTedTransactionTag: string,
    bankingTedOperationTedP2PDescription: string,
    bankingTedOperationTedDescription: string,
    bankingTedZroBankCode: string,
    bankingTedCallbackUrl: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingBankingTedEventController.name,
    });

    const bankingTedEventEmitter = new BankingTedEventEmitterController(
      bankingTedEmitter,
    );

    const bankingTedReceivedEventEmitter =
      new BankingTedReceivedEventEmitterController(bankingTedReceivedEmitter);

    this.usecase = new UseCase(
      logger,
      bankingTedRepository,
      bankTedRepository,
      bankingTedReceivedRepository,
      bankingContactRepository,
      bankingAccountContactRepository,
      pspGateway,
      bankingTedEventEmitter,
      bankingTedReceivedEventEmitter,
      operationService,
      userService,
      bankingTedOperationCurrencyTag,
      bankingTedOperationTedP2PTransactionTag,
      bankingTedOperationTedTransactionTag,
      bankingTedOperationTedP2PDescription,
      bankingTedOperationTedDescription,
      bankingTedZroBankCode,
      bankingTedCallbackUrl,
    );
  }

  async execute(
    request: HandlePendingBankingTedEventRequest,
  ): Promise<HandlePendingBankingTedEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id, walletId } = request;
    const wallet = new WalletEntity({ uuid: walletId });

    const bankingTed = await this.usecase.execute(id, wallet);

    if (!bankingTed) return null;

    const response = new HandlePendingBankingTedEventResponse({
      id: bankingTed.id,
      state: bankingTed.state,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Handle pending event by ID response.', {
      bankingTed: response,
    });

    return response;
  }
}
