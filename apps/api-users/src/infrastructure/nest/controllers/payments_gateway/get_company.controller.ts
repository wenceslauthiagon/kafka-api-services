import { Logger } from 'winston';
import { Controller, Get } from '@nestjs/common';
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
import { GetCompanyServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetCompanyRequest,
  GetCompanyResponse,
  Bank,
  Company,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthWallet } from '@zro/operations/domain';

export class GetCompanyRestResponse {
  @ApiProperty({
    description: 'Company ID.',
    example: '1',
  })
  id: number;

  @ApiProperty({
    description: 'Company IE.',
    example: '123123123',
  })
  ie: string;

  @ApiProperty({
    description: 'Company Name.',
    example: 'MASTER COMPANY LTDA',
  })
  name: string;

  @ApiProperty({
    description: 'Company CNPJ.',
    example: '12312312312312',
  })
  cnpj: string;

  @ApiProperty({
    description: 'Company Phone Number.',
    example: '81912312312',
  })
  phone: string;

  @ApiProperty({
    description: 'Company Is Matrix.',
    example: 'true',
  })
  is_matrix: boolean;

  @ApiProperty({
    description: 'Company Trading Name.',
    example: 'MASTER',
  })
  trading_name: string;

  @ApiProperty({
    description: 'Company Plan ID.',
    example: '1',
  })
  plan_id: number;

  @ApiProperty({
    description: 'Company Responsible ID.',
    example: '1',
  })
  responsible_id: number;

  @ApiProperty({
    description: 'Company Wallet ID.',
    example: 'af471565-c3ef-41f8-ac4e-b6096ab6886b',
  })
  wallet_id: string;

  @ApiProperty({
    description: 'Company Webhook Transaction.',
    example: 'null',
  })
  webhook_transaction: any;

  @ApiProperty({
    description: 'Company Webhook Withdraw.',
    example: 'null',
  })
  webhook_withdraw: any;

  @ApiProperty({
    description: 'Company Created At.',
    example: '2023-02-08T18:23:03+00:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Company Updated At.',
    example: '2023-02-08T18:23:03+00:00',
  })
  updated_at: string;

  @ApiPropertyOptional({
    description: 'Company Subaccounts.',
    example: '[]',
  })
  branches?: Company[];

  @ApiPropertyOptional({
    description: 'Company Bank Accounts.',
    example: '[]',
  })
  bank_accounts?: Bank[];

  @ApiPropertyOptional({
    description: 'Active Bank For Cash In.',
    example: 'null',
  })
  active_bank_for_cash_in?: Bank;

  @ApiPropertyOptional({
    description: 'Active Bank For Cash Out.',
    example: 'null',
  })
  active_bank_for_cash_out?: Bank;

  constructor(props: GetCompanyResponse) {
    this.id = props.id;
    this.ie = props.ie;
    this.name = props.name;
    this.cnpj = props.cnpj;
    this.phone = props.phone;
    this.is_matrix = props.is_matrix;
    this.trading_name = props.trading_name;
    this.plan_id = props.plan_id;
    this.responsible_id = props.responsible_id;
    this.wallet_id = props.wallet_id;
    this.webhook_transaction = props.webhook_transaction;
    this.webhook_withdraw = props.webhook_withdraw;
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;
    this.branches = props.branches;
    this.bank_accounts = props.bank_accounts;
    this.active_bank_for_cash_in = props.active_bank_for_cash_in;
    this.active_bank_for_cash_out = props.active_bank_for_cash_out;
  }
}

/**
 * GetCompany controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Company')
@Controller('payments-gateway/company')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-company')
export class GetCompanyRestController {
  /**
   * Get company endpoint.
   */
  @ApiOperation({
    summary: 'Get my company.',
    description: 'Execute to get your company information.',
  })
  @ApiOkResponse({
    description: 'Company found successfully.',
    type: GetCompanyRestResponse,
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
    @KafkaServiceParam(GetCompanyServiceKafka)
    service: GetCompanyServiceKafka,
    @LoggerParam(GetCompanyRestController)
    logger: Logger,
  ): Promise<GetCompanyRestResponse> {
    // Creates a payload
    const payload: GetCompanyRequest = {
      wallet_id: wallet.id,
    };

    logger.debug('Get company.', { user, payload });

    // Call get company service.
    const result = await service.execute(payload);

    logger.debug('Company deposit.', { result });

    const response = result && new GetCompanyRestResponse(result);

    return response;
  }
}
