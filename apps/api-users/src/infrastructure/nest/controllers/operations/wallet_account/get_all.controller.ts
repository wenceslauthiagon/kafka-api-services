import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { CurrencySymbolAlign, AuthWallet } from '@zro/operations/domain';
import {
  GetAllWalletAccountResponseItem,
  GetAllWalletAccountResponse,
  GetAllWalletAccountRequest,
  GetAllWalletAccountRequestSort,
} from '@zro/operations/interface';
import {
  AuthWalletParam,
  GetAllWalletAccountServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

class GetAllWalletAccountParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllWalletAccountRequestSort,
  })
  @IsOptional()
  @Sort(GetAllWalletAccountRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'WalletAccount currency symbol.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  currency_symbol?: string;
}

class GetAllWalletAccountRestResponseItem {
  @ApiProperty({
    description: 'Wallet account id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Value in cents.',
    example: 10000,
  })
  balance: number;

  @ApiPropertyOptional({
    description: 'Value in cents.',
    example: 5000,
  })
  pending_amount: number;

  @ApiPropertyOptional({
    description: 'Value in cents.',
    example: 5000,
  })
  average_price: number;

  @ApiProperty({
    description: 'The currency id.',
    example: 21,
  })
  currency_id: number;

  @ApiPropertyOptional({
    description: 'The currency title.',
    example: 'Bitcoin',
  })
  currency_title: string;

  @ApiProperty({
    description: 'The currency decimal.',
    example: 8,
  })
  currency_decimal: number;

  @ApiProperty({
    description: 'The currency symbol.',
    example: 'BRL',
  })
  currency_symbol: string;

  @ApiProperty({
    description: 'The currency symbol align.',
    enum: CurrencySymbolAlign,
    example: CurrencySymbolAlign.RIGHT,
  })
  currency_symbol_align: CurrencySymbolAlign;

  constructor(props: GetAllWalletAccountResponseItem) {
    this.id = props.uuid;
    this.balance = props.balance;
    this.pending_amount = props.pendingAmount;
    this.average_price = props.averagePrice;
    this.currency_id = props.currencyId;
    this.currency_title = props.currencyTitle;
    this.currency_decimal = props.currencyDecimal;
    this.currency_symbol = props.currencySymbol;
    this.currency_symbol_align = props.currencySymbolAlign;
  }
}

export class GetAllWalletAccountRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'WalletAccounts data.',
    type: [GetAllWalletAccountRestResponseItem],
  })
  data!: GetAllWalletAccountRestResponseItem[];

  constructor(props: GetAllWalletAccountResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllWalletAccountRestResponseItem(item),
    );
  }
}

/**
 * WalletAccounts controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Wallet Accounts')
@Controller('operations/wallet-accounts')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@HasPermission('api-users-get-operations-wallet-accounts')
export class GetAllWalletAccountRestController {
  /**
   * get walletAccounts endpoint.
   */
  @ApiOperation({
    summary: "List user's wallet accounts.",
    description: "Get a list of user's wallet accounts.",
  })
  @ApiOkResponse({
    description: 'The wallet accounts returned successfully.',
    type: GetAllWalletAccountRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Query() query: GetAllWalletAccountParams,
    @KafkaServiceParam(GetAllWalletAccountServiceKafka)
    getAllWalletAccountService: GetAllWalletAccountServiceKafka,
    @LoggerParam(GetAllWalletAccountRestController)
    logger: Logger,
  ): Promise<GetAllWalletAccountRestResponse> {
    // GetAll payload.
    const payload: GetAllWalletAccountRequest = {
      // WalletAccount query
      userId: user.uuid,
      walletId: wallet.id,
      currencySymbol: query.currency_symbol,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll walletAccounts.', { user, payload });

    // Call get all walletAccount service.
    const result = await getAllWalletAccountService.execute(payload);

    logger.debug('WalletAccounts found.', { result });

    const response = new GetAllWalletAccountRestResponse(result);

    return response;
  }
}
