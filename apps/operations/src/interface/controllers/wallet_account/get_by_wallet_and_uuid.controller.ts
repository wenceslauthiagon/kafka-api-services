import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  Currency,
  CurrencySymbolAlign,
  Wallet,
  WalletAccount,
  WalletAccountRepository,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import { GetWalletAccountByWalletAndUuidUseCase as UseCase } from '@zro/operations/application';

type TGetWalletAccountByWalletAndUuidRequest = {
  walletId: Wallet['uuid'];
  uuid: WalletAccount['uuid'];
};

export class GetWalletAccountByWalletAndUuidRequest
  extends AutoValidator
  implements TGetWalletAccountByWalletAndUuidRequest
{
  @IsUUID(4)
  walletId: string;

  @IsUUID(4)
  uuid: string;

  constructor(props: TGetWalletAccountByWalletAndUuidRequest) {
    super(props);
  }
}

type TGetWalletAccountByWalletAndUuidResponse = Pick<
  WalletAccount,
  | 'id'
  | 'balance'
  | 'pendingAmount'
  | 'accountNumber'
  | 'branchNumber'
  | 'accountId'
  | 'state'
  | 'uuid'
> & {
  walletId: Wallet['uuid'];
  currencyId: Currency['id'];
  currencyTitle: Currency['title'];
  currencyDecimal: Currency['decimal'];
  currencySymbol: Currency['symbol'];
  currencySymbolAlign: Currency['symbolAlign'];
};

export class GetWalletAccountByWalletAndUuidResponse
  extends AutoValidator
  implements TGetWalletAccountByWalletAndUuidResponse
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
  @IsOptional()
  accountId?: number;

  @IsEnum(WalletAccountState)
  state: WalletAccount['state'];

  @IsInt()
  @IsPositive()
  currencyId: number;

  @IsString()
  @Length(1, 255)
  currencyTitle: string;

  @IsInt()
  @Min(0)
  currencyDecimal: number;

  @IsString()
  @Length(1, 255)
  currencySymbol: string;

  @IsEnum(CurrencySymbolAlign)
  currencySymbolAlign: CurrencySymbolAlign;

  constructor(props: TGetWalletAccountByWalletAndUuidResponse) {
    super(props);
  }
}

export class GetWalletAccountByWalletAndUuidController {
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletAccountRepository Wallet account repository.
   */
  constructor(
    private logger: Logger,
    walletAccountRepository: WalletAccountRepository,
  ) {
    this.logger = logger.child({
      context: GetWalletAccountByWalletAndUuidController.name,
    });

    this.usecase = new UseCase(this.logger, walletAccountRepository);
  }

  /**
   * Search wallet account by wallet and uuid.
   *
   * @param request Input data.
   * @returns Wallet account if found or null otherwise.
   */
  async execute(
    request: GetWalletAccountByWalletAndUuidRequest,
  ): Promise<GetWalletAccountByWalletAndUuidResponse> {
    this.logger.debug('Get wallet account by wallet and id.', {
      request,
    });

    const { walletId, uuid } = request;

    const wallet = new WalletEntity({ uuid: walletId });

    const result = await this.usecase.execute(wallet, uuid);

    const response =
      result &&
      new GetWalletAccountByWalletAndUuidResponse({
        id: result.id,
        uuid: result.uuid,
        balance: result.balance,
        pendingAmount: result.pendingAmount,
        walletId: result.wallet.uuid,
        accountNumber: result.accountNumber,
        branchNumber: result.branchNumber,
        accountId: result.accountId,
        state: result.state,
        currencyId: result.currency.id,
        currencyTitle: result.currency.title,
        currencyDecimal: result.currency.decimal,
        currencySymbol: result.currency.symbol,
        currencySymbolAlign: result.currency.symbolAlign,
      });

    return response;
  }
}
