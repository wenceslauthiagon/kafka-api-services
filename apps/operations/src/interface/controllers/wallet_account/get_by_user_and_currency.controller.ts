import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  Currency,
  CurrencyEntity,
  CurrencyRepository,
  Wallet,
  WalletAccount,
  WalletAccountRepository,
  WalletAccountState,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { GetWalletAccountByUserAndCurrencyUseCase as UseCase } from '@zro/operations/application';

type TGetWalletAccountByUserAndCurrencyRequest = {
  userId: User['uuid'];
  currencyTag: Currency['tag'];
};

export class GetWalletAccountByUserAndCurrencyRequest
  extends AutoValidator
  implements TGetWalletAccountByUserAndCurrencyRequest
{
  @IsUUID(4)
  userId: string;

  @IsString()
  currencyTag: string;

  constructor(props: TGetWalletAccountByUserAndCurrencyRequest) {
    super(props);
  }
}

type TGetWalletAccountByUserAndCurrencyResponse = Pick<
  WalletAccount,
  | 'id'
  | 'uuid'
  | 'balance'
  | 'pendingAmount'
  | 'accountNumber'
  | 'branchNumber'
  | 'accountId'
  | 'state'
> & { walletId: Wallet['uuid']; currencyId: Currency['id'] };

export class GetWalletAccountByUserAndCurrencyResponse
  extends AutoValidator
  implements TGetWalletAccountByUserAndCurrencyResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsInt()
  balance: number;

  @IsInt()
  pendingAmount: number;

  @IsString()
  accountNumber: string;

  @IsString()
  branchNumber: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  accountId?: number;

  @IsUUID(4)
  walletId: string;

  @IsInt()
  @IsPositive()
  currencyId: number;

  @IsEnum(WalletAccountState)
  state: WalletAccount['state'];

  constructor(props: TGetWalletAccountByUserAndCurrencyResponse) {
    super(props);
  }
}

export class GetWalletAccountByUserAndCurrencyController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletAccountRepository Wallet account repository.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private logger: Logger,
    walletAccountRepository: WalletAccountRepository,
    currencyRepository: CurrencyRepository,
  ) {
    this.logger = logger.child({
      context: GetWalletAccountByUserAndCurrencyController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletAccountRepository,
      currencyRepository,
    );
  }

  /**
   * Search wallet account by user and currency.
   *
   * @param request Input data.
   * @returns Wallet account if found or null otherwise.
   */
  async execute(
    request: GetWalletAccountByUserAndCurrencyRequest,
  ): Promise<GetWalletAccountByUserAndCurrencyResponse> {
    this.logger.debug('Get wallet account by user and currency.', { request });

    const { userId, currencyTag } = request;

    const user = new UserEntity({ uuid: userId });
    const currency = new CurrencyEntity({ tag: currencyTag });

    const result = await this.usecase.execute(user, currency);

    if (!result) return null;

    const response = new GetWalletAccountByUserAndCurrencyResponse({
      id: result.id,
      uuid: result.uuid,
      balance: result.balance,
      pendingAmount: result.pendingAmount,
      walletId: result.wallet.uuid,
      currencyId: result.currency.id,
      accountNumber: result.accountNumber,
      branchNumber: result.branchNumber,
      accountId: result.accountId,
      state: result.state,
    });

    return response;
  }
}
