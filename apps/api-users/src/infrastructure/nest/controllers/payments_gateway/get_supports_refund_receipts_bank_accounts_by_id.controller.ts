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
import { GetSupportsRefundReceiptsBankAccountsServiceKafka } from '@zro/payments-gateway/infrastructure';
import { GetRefundReceiptsBankAccountsRequest } from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import { IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSupportsRefundReceiptsBankAccountsParams {
  @ApiProperty({
    description: 'Bank Account ID.',
    example: 1,
  })
  @IsInt()
  @Transform((params) => params && parseInt(params.value))
  id?: number;
}

export class GetSupportsRefundReceiptsBankAccountsQuery {
  @ApiPropertyOptional({
    description: 'End to end.',
    example: 'E1954055020230831164544568757715',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  end_to_end?: string;
}

export class GetRefundReceiptsBankAccountsRestResponse {
  @ApiProperty({
    description: 'base64 refund receipts found.',
    example:
      'dummy_refund_VGhpcyBpcyBhIG51bWJlciBvZiB0aGUgc3RyaW5nIGJhc2U2NCBpcyBub3QgYSBxdWVzdGlvbiB3aXRob3V0IGFyZSBkZXNpZ25lZCB0byBhIHN0cmluZyBiYXNlNjQu',
  })
  base64_receipt: string;

  constructor(props: GetRefundReceiptsBankAccountsRestResponse) {
    this.base64_receipt = props.base64_receipt;
  }
}

/**
 * GetSupportsRefundReceiptsBankAccounts controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Supports | Receipts')
@Controller('payments-gateway/supports/refund-receipts/bank-accounts/:id')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-payments-gateway-supports-refund')
export class GetSupportsRefundReceiptsBankAccountsRestController {
  /**
   * Get Supports Refund Receipts Bank Account sendpoint.
   */
  @ApiOperation({
    summary: 'List refund receipts.',
    description:
      'Get a list of refund receipts. You can include any of the filter parameters below to refine your search.',
  })
  @ApiOkResponse({
    description: 'Refund receipts found successfully.',
    type: GetRefundReceiptsBankAccountsRestResponse,
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
    @Query() query: GetSupportsRefundReceiptsBankAccountsQuery,
    @Param() params: GetSupportsRefundReceiptsBankAccountsParams,
    @KafkaServiceParam(GetSupportsRefundReceiptsBankAccountsServiceKafka)
    service: GetSupportsRefundReceiptsBankAccountsServiceKafka,
    @LoggerParam(GetSupportsRefundReceiptsBankAccountsRestController)
    logger: Logger,
  ): Promise<GetRefundReceiptsBankAccountsRestResponse> {
    // Creates a payload

    const payload: GetRefundReceiptsBankAccountsRequest = {
      wallet_id: wallet.id,
      bank_account_id: params.id,
      end_to_end: query.end_to_end,
    };

    logger.debug('Get refund receipts.', { user, wallet, payload });

    // Call refund receipts bank accounts service.
    const result = await service.execute(payload);

    logger.debug('Found refund receipts.', { result });

    const response =
      result && new GetRefundReceiptsBankAccountsRestResponse(result);

    return response;
  }
}
