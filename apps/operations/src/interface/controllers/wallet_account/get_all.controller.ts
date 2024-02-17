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
import {
  Pagination,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
  AutoValidator,
  Sort,
  PaginationSort,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  WalletAccount,
  WalletAccountRepository,
  TGetWalletAccountFilter,
  Currency,
  CurrencySymbolAlign,
  WalletEntity,
  Wallet,
  WalletAccountState,
} from '@zro/operations/domain';
import { GetAllWalletAccountUseCase as UseCase } from '@zro/operations/application';

export enum GetAllWalletAccountRequestSort {
  CURRENCY_SYMBOL = 'currencySymbol',
}

type TGetAllWalletAccountRequest = Pagination &
  TGetWalletAccountFilter & {
    userId: User['uuid'];
    walletId: Wallet['uuid'];
  };

export class GetAllWalletAccountRequest
  extends PaginationRequest
  implements TGetAllWalletAccountRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  walletId: string;

  @IsOptional()
  @Sort(GetAllWalletAccountRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  currencySymbol?: string;

  constructor(props: TGetAllWalletAccountRequest) {
    super(props);
  }
}

type TGetAllWalletAccountResponseItem = Pick<
  WalletAccount,
  'id' | 'uuid' | 'balance' | 'pendingAmount' | 'averagePrice' | 'state'
> & {
  currencyId: Currency['id'];
  currencyTitle: Currency['title'];
  currencyDecimal: Currency['decimal'];
  currencySymbol: Currency['symbol'];
  currencySymbolAlign: Currency['symbolAlign'];
};

export class GetAllWalletAccountResponseItem
  extends AutoValidator
  implements TGetAllWalletAccountResponseItem
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

  @IsInt()
  averagePrice: number;

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

  @IsEnum(WalletAccountState)
  state: WalletAccount['state'];

  constructor(props: TGetAllWalletAccountResponseItem) {
    super(props);
  }
}

export class GetAllWalletAccountResponse extends PaginationResponse<GetAllWalletAccountResponseItem> {}

export class GetAllWalletAccountController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletAccountRepository: WalletAccountRepository,
  ) {
    this.logger = logger.child({ context: GetAllWalletAccountController.name });
    this.usecase = new UseCase(this.logger, walletAccountRepository);
  }

  async execute(
    request: GetAllWalletAccountRequest,
  ): Promise<GetAllWalletAccountResponse> {
    this.logger.debug('Get all walletAccounts request.', { request });

    const { walletId, currencySymbol, order, page, pageSize, sort } = request;

    const wallet = new WalletEntity({ uuid: walletId });
    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const filter: TGetWalletAccountFilter = {
      ...(currencySymbol && { currencySymbol }),
    };

    const result = await this.usecase.execute(wallet, pagination, filter);

    const data = result.data.map(
      (item) =>
        new GetAllWalletAccountResponseItem({
          id: item.id,
          uuid: item.uuid,
          balance: item.balance,
          pendingAmount: item.pendingAmount,
          averagePrice: item.averagePrice,
          currencyId: item.currency.id,
          currencyTitle: item.currency.title,
          currencyDecimal: item.currency.decimal,
          currencySymbol: item.currency.symbol,
          currencySymbolAlign: item.currency.symbolAlign,
          state: item.state,
        }),
    );

    const response = new GetAllWalletAccountResponse({ ...result, data });

    this.logger.debug('Get all walletAccounts response.', { response });

    return response;
  }
}
