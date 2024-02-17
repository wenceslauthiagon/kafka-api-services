import { Logger } from 'winston';
import { IsEnum, IsInt, IsPositive, IsString, IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Currency,
  CurrencyEntity,
  CurrencyRepository,
  Wallet,
  WalletAccount,
  WalletAccountRepository,
  WalletAccountState,
} from '@zro/operations/domain';
import { GetWalletAccountByAccountNumberAndCurrencyUseCase as UseCase } from '@zro/operations/application';

type TGetWalletAccountByAccountNumberAndCurrencyRequest = {
  accountNumber: WalletAccount['accountNumber'];
  currencyTag: Currency['tag'];
};

export class GetWalletAccountByAccountNumberAndCurrencyRequest
  extends AutoValidator
  implements TGetWalletAccountByAccountNumberAndCurrencyRequest
{
  @IsString()
  accountNumber: string;

  @IsString()
  currencyTag: string;

  constructor(props: TGetWalletAccountByAccountNumberAndCurrencyRequest) {
    super(props);
  }
}

type TGetWalletAccountByAccountNumberAndCurrencyResponse = Pick<
  WalletAccount,
  'id' | 'uuid' | 'accountNumber' | 'branchNumber' | 'state'
> & {
  userId: User['uuid'];
  walletId: Wallet['uuid'];
  currencyId: Currency['id'];
};

export class GetWalletAccountByAccountNumberAndCurrencyResponse
  extends AutoValidator
  implements TGetWalletAccountByAccountNumberAndCurrencyResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID(4)
  uuid: string;

  @IsString()
  accountNumber: string;

  @IsString()
  branchNumber: string;

  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  walletId: string;

  @IsInt()
  @IsPositive()
  currencyId: number;

  @IsEnum(WalletAccountState)
  state: WalletAccount['state'];

  constructor(props: TGetWalletAccountByAccountNumberAndCurrencyResponse) {
    super(props);
  }
}

export class GetWalletAccountByAccountNumberAndCurrencyController {
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
      context: GetWalletAccountByAccountNumberAndCurrencyController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletAccountRepository,
      currencyRepository,
    );
  }

  /**
   * Search wallet account by account number and currency.
   *
   * @param request Input data.
   * @returns Wallet account if found or null otherwise.
   */
  async execute(
    request: GetWalletAccountByAccountNumberAndCurrencyRequest,
  ): Promise<GetWalletAccountByAccountNumberAndCurrencyResponse> {
    this.logger.debug('Get wallet account by account number and currency.', {
      request,
    });

    const { accountNumber, currencyTag } = request;

    const currency = new CurrencyEntity({ tag: currencyTag });

    const result = await this.usecase.execute(accountNumber, currency);

    if (!result) return null;

    const response = new GetWalletAccountByAccountNumberAndCurrencyResponse({
      id: result.id,
      uuid: result.uuid,
      walletId: result.wallet.uuid,
      currencyId: result.currency.id,
      accountNumber: result.accountNumber,
      branchNumber: result.branchNumber,
      userId: result.wallet.user.uuid,
      state: result.state,
    });

    return response;
  }
}
