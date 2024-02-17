import { Logger } from 'winston';
import { Controller, Get, Param, Query } from '@nestjs/common';
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
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetSupportsWithdrawReceiptsBankAccountsServiceKafka } from '@zro/payments-gateway/infrastructure';
import { GetWithdrawReceiptsBankAccountsRequest } from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import { IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSupportsWithdrawReceiptsBankAccountsParams {
  @ApiProperty({
    description: 'Bank Account ID.',
    example: 1,
  })
  @IsInt()
  @Transform((params) => params && parseInt(params.value))
  id?: number;
}

export class GetSupportsWithdrawReceiptsBankAccountsQuery {
  @ApiPropertyOptional({
    description: 'End to end.',
    example: 'E1954055020230831164544568757715',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  end_to_end?: string;
}

export class GetWithdrawReceiptsBankAccountsRestResponse {
  @ApiProperty({
    description: 'base64 withdraw receipts found.',
    example:
      'dummy_withdraw_VGhpcyBpcyBhIG51bWJlciBvZiB0aGUgc3RyaW5nIGJhc2U2NCBpcyBub3QgYSBxdWVzdGlvbiB3aXRob3V0IGFyZSBkZXNpZ25lZCB0byBhIHN0cmluZyBiYXNlNjQu',
  })
  base64_receipt: string;

  constructor(props: GetWithdrawReceiptsBankAccountsRestResponse) {
    this.base64_receipt = props.base64_receipt;
  }
}

/**
 * GetSupportsWithdrawReceiptsBankAccounts controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Supports | Receipts')
@Controller('payments-gateway/supports/withdraw-receipts/bank-accounts/:id')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-payments-gateway-supports-withdraw')
export class GetSupportsWithdrawReceiptsBankAccountsRestController {
  /**
   * Get Supports Withdraw Receipts Bank Account sendpoint.
   */
  @ApiOperation({
    summary: 'List withdraw receipts.',
    description:
      'Get a list of withdraw receipts. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'Withdraw receipts found successfully.',
    type: GetWithdrawReceiptsBankAccountsRestResponse,
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
    @Query() query: GetSupportsWithdrawReceiptsBankAccountsQuery,
    @Param() params: GetSupportsWithdrawReceiptsBankAccountsParams,
    @KafkaServiceParam(GetSupportsWithdrawReceiptsBankAccountsServiceKafka)
    service: GetSupportsWithdrawReceiptsBankAccountsServiceKafka,
    @LoggerParam(GetSupportsWithdrawReceiptsBankAccountsRestController)
    logger: Logger,
  ): Promise<GetWithdrawReceiptsBankAccountsRestResponse> {
    // Creates a payload

    const payload: GetWithdrawReceiptsBankAccountsRequest = {
      wallet_id: wallet.id,
      bank_account_id: params.id,
      end_to_end: query.end_to_end,
    };

    logger.debug('Get withdraw receipts.', { user, wallet, payload });

    // Call withdraw receipts bank accounts service.
    const result = await service.execute(payload);

    logger.debug('Found withdraw receipts.', { result });

    const response =
      result && new GetWithdrawReceiptsBankAccountsRestResponse(result);

    return response;
  }
}
