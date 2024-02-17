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
  WalletEntity,
} from '@zro/operations/domain';
import { GetWalletAccountByWalletAndCurrencyUseCase as UseCase } from '@zro/operations/application';

type TGetWalletAccountByWalletAndCurrencyRequest = {
  walletId: Wallet['uuid'];
  currencyTag: Currency['tag'];
};

export class GetWalletAccountByWalletAndCurrencyRequest
  extends AutoValidator
  implements TGetWalletAccountByWalletAndCurrencyRequest
{
  @IsUUID(4)
  walletId: string;

  @IsString()
  currencyTag: string;

  constructor(props: TGetWalletAccountByWalletAndCurrencyRequest) {
    super(props);
  }
}

type TGetWalletAccountByWalletAndCurrencyResponse = Pick<
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

export class GetWalletAccountByWalletAndCurrencyResponse
  extends AutoValidator
  implements TGetWalletAccountByWalletAndCurrencyResponse
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
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  branchNumber?: string;

  @IsUUID(4)
  walletId: string;

  @IsInt()
  @IsPositive()
  currencyId: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  accountId?: number;

  @IsEnum(WalletAccountState)
  state: WalletAccount['state'];

  constructor(props: TGetWalletAccountByWalletAndCurrencyResponse) {
    super(props);
  }
}

export class GetWalletAccountByWalletAndCurrencyController {
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
      context: GetWalletAccountByWalletAndCurrencyController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletAccountRepository,
      currencyRepository,
    );
  }

  /**
   * Search wallet account by wallet and currency.
   *
   * @param request Input data.
   * @returns Wallet account if found or null otherwise.
   */
  async execute(
    request: GetWalletAccountByWalletAndCurrencyRequest,
  ): Promise<GetWalletAccountByWalletAndCurrencyResponse> {
    this.logger.debug('Get wallet account by wallet and currency.', {
      request,
    });

    const { walletId, currencyTag } = request;

    const wallet = new WalletEntity({ uuid: walletId });
    const currency = new CurrencyEntity({ tag: currencyTag });

    const result = await this.usecase.execute(wallet, currency);

    if (!result) return null;

    const response = new GetWalletAccountByWalletAndCurrencyResponse({
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
