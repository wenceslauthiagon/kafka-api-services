import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
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
import { IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetWithdrawalByIdServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetTransactionByIdRequest,
  TransactionResponseItem,
  TBank,
  TClient,
  TCompany,
  TKyc,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { ErrorDescriptionRestResponse } from './default';

export class GetWithdrawalByIdParams {
  @ApiProperty({
    description: 'Withdrawal ID.',
  })
  @IsPositive()
  @Transform((params) => params && parseInt(params.value))
  id: number;
}

export class GetWithdrawalByIdRestResponse {
  @ApiProperty({
    description: 'Withdrawal ID.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Process status.',
    examples: ['waiting', 'completed', 'failed'],
  })
  process_status?: string;

  @ApiProperty({
    description: 'Withdrawal reference.',
    example: '99b22dde-a97d-11ed-afa1-0242ac120002',
  })
  reference: string;

  @ApiPropertyOptional({
    description: 'Withdrawal main transaction.',
    example: 'acc662aa-9f3b-445f-813d-bcb50e3abbdb',
  })
  main_transaction?: string;

  @ApiProperty({
    description: 'Withdrawal UUID.',
    example: 'acc662aa-9f3b-445f-813d-bcb50e3abbdb',
  })
  uuid: string;

  @ApiProperty({
    description: 'Withdrawal description.',
    example: 'Teste',
  })
  description: string;

  @ApiProperty({
    description: 'Withdrawal payment type.',
    example: 'pix',
  })
  payment_type: string;

  @ApiProperty({
    description: 'Withdrawal status.',
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'Withdrawal PIX key type.',
    example: 'EVP',
  })
  type_key_pix: string;

  @ApiProperty({
    description: 'Withdrawal PIX key.',
    example: '066cf2db-0f74-4d02-99b9-a4e695c6a10a',
  })
  key_pix: string;

  @ApiProperty({
    description: 'Withdrawal fee value.',
    example: '0,00',
  })
  fee_value: string;

  @ApiProperty({
    description: 'Withdrawal value.',
    example: '1,99',
  })
  value: string;

  @ApiProperty({
    description: 'Withdrawal creation date.',
    example: '2022-12-07T20:05:17+00:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Withdrawal last update.',
    example: '2022-12-07T20:05:17+00:00',
  })
  updated_at: string;

  @ApiProperty({
    description: 'Withdrawal transaction type.',
    example: 'returned',
  })
  transaction_type: string;

  @ApiPropertyOptional({
    description: 'End to end ID.',
  })
  end_to_end_id_field?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal PSP bank name.',
    example: 'Banco psp',
  })
  psp_bank_name?: string;

  @ApiPropertyOptional({
    description: 'Withdrawal PSP bank ISPB.',
    example: '111111',
  })
  psp_ispb?: string;

  @ApiProperty({
    description: 'Withdrawal company ID.',
    example: 1,
  })
  company_id: number;

  @ApiPropertyOptional({
    description: 'Withdrawal instant payment ID field.',
    example: 2,
  })
  instant_payment_id_field?: string;

  @ApiProperty({
    description: 'Withdrawal error description.',
    example: ErrorDescriptionRestResponse,
  })
  error_description: ErrorDescriptionRestResponse;

  @ApiProperty({
    description: 'Withdrawal company.',
    example: null,
  })
  company: TCompany;

  @ApiProperty({
    description: 'Withdrawal client.',
    example: null,
  })
  client: TClient;

  @ApiPropertyOptional()
  kyc?: TKyc;

  @ApiProperty({
    description: 'Withdrawal bank.',
    example: null,
  })
  bank: TBank;
  constructor(props: TransactionResponseItem) {
    this.id = props.id;
    this.process_status = props.process_status;
    this.reference = props.reference;
    this.main_transaction = props.main_transaction;
    this.uuid = props.uuid;
    this.description = props.description;
    this.payment_type = props.payment_type;
    this.status = props.status;
    this.type_key_pix = props.type_key_pix;
    this.key_pix = props.key_pix;
    this.fee_value = props.fee_value;
    this.value = props.value;
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;
    this.transaction_type = props.transaction_type;
    this.end_to_end_id_field = props.end_to_end_id_field;
    this.psp_bank_name = props.psp_bank_name;
    this.psp_ispb = props.psp_ispb;
    this.company_id = props.company_id;
    this.instant_payment_id_field = props.instant_payment_id_field;
    this.error_description = props.error_description;
    this.company = props.company;
    this.client = props.client;
    this.bank = props.bank;
    this.kyc = props.kyc;
  }
}

/**
 * GetWithdrawalById controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Withdrawals')
@Controller('payments-gateway/withdrawals/:id')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-withdrawals-by-id')
export class GetWithdrawalByIdRestController {
  /**
   * Get withdrawal by id endpoint.
   */
  @ApiOperation({
    summary: 'Get withdrawal by ID.',
    description:
      "Enter the withdrawal's ID below and execute to get its information.",
  })
  @ApiOkResponse({
    description: 'WithdrawalById found successfully.',
    type: GetWithdrawalByIdRestResponse,
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
    @Param() params: GetWithdrawalByIdParams,
    @KafkaServiceParam(GetWithdrawalByIdServiceKafka)
    service: GetWithdrawalByIdServiceKafka,
    @LoggerParam(GetWithdrawalByIdRestController)
    logger: Logger,
  ): Promise<GetWithdrawalByIdRestResponse> {
    // Creates a payload
    const payload: GetTransactionByIdRequest = {
      wallet_id: wallet.id,
      id: params.id,
    };

    logger.debug('Get withdrawal by id.', { user, wallet, payload });

    // Call withdrawal by id service.
    const result = await service.execute(payload);

    logger.debug('Found withdrawal.', { result });

    const response = result && new GetWithdrawalByIdRestResponse(result);

    return response;
  }
}
