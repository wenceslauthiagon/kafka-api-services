import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
import { IsUUID } from 'class-validator';
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
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import {
  AuthWallet,
  CurrencySymbolAlign,
  WalletAccountState,
} from '@zro/operations/domain';
import {
  GetWalletAccountByWalletAndUuidResponse,
  GetWalletAccountByWalletAndUuidRequest,
} from '@zro/operations/interface';
import {
  AuthWalletParam,
  GetWalletAccountByWalletAndUuidServiceKafka,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';

export class GetWalletAccountByIdParams {
  @ApiProperty({
    description: 'Wallet account id.',
  })
  @IsUUID(4)
  id!: string;
}

class GetWalletAccountByIdRestResponse {
  @ApiProperty({
    description: 'Wallet Account uuid.',
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

  @ApiProperty({
    description: 'Wallet account state.',
    enum: WalletAccountState,
    example: WalletAccountState.ACTIVE,
  })
  state: WalletAccountState;

  @ApiPropertyOptional({
    description: 'Wallet account number.',
  })
  account_number?: string;

  @ApiPropertyOptional({
    description: 'Wallet account branch number.',
  })
  branch_number?: string;

  @ApiProperty({
    description: 'Wallet account wallet id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  wallet_id: string;

  @ApiProperty({
    description: 'Wallet account currency id.',
    example: 27,
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

  constructor(props: GetWalletAccountByWalletAndUuidResponse) {
    this.id = props.uuid;
    this.balance = props.balance;
    this.pending_amount = props.pendingAmount;
    this.state = props.state;
    this.account_number = props.accountNumber;
    this.branch_number = props.branchNumber;
    this.wallet_id = props.walletId;
    this.currency_id = props.currencyId;
    this.currency_title = props.currencyTitle;
    this.currency_decimal = props.currencyDecimal;
    this.currency_symbol = props.currencySymbol;
    this.currency_symbol_align = props.currencySymbolAlign;
  }
}

/**
 * WalletAccounts controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | Wallet Accounts')
@Controller('operations/wallet-accounts/:id')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@HasPermission('api-users-get-operations-wallet-accounts-by-id')
export class GetWalletAccountByIdRestController {
  /**
   * get walletAccounts by id endpoint.
   */
  @ApiOperation({
    summary: "Get user's wallet account by id.",
    description: "Get a user's wallet account by id.",
  })
  @ApiOkResponse({
    description: 'The wallet account returned successfully.',
    type: GetWalletAccountByIdRestResponse,
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
    @Param() query: GetWalletAccountByIdParams,
    @KafkaServiceParam(GetWalletAccountByWalletAndUuidServiceKafka)
    getWalletAccountByWalletAndUuidService: GetWalletAccountByWalletAndUuidServiceKafka,
    @LoggerParam(GetWalletAccountByIdRestController)
    logger: Logger,
  ): Promise<GetWalletAccountByIdRestResponse> {
    const payload: GetWalletAccountByWalletAndUuidRequest = {
      walletId: wallet.id,
      uuid: query.id,
    };

    logger.debug('Get wallet account by id.', { user, payload });

    const result =
      await getWalletAccountByWalletAndUuidService.execute(payload);

    logger.debug('Wallet Account found.', { result });

    const response = result && new GetWalletAccountByIdRestResponse(result);

    return response;
  }
}
