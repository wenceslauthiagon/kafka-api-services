import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
import { IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
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
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetDepositByIdServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetTransactionByIdRequest,
  TransactionResponseItem,
  TBank,
  TClient,
  TCompany,
  TPaidByClient,
  TKyc,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { ErrorDescriptionRestResponse } from './default';

export class GetDepositByIdParams {
  @ApiProperty({
    description: 'Deposit ID.',
  })
  @IsPositive()
  @Transform((params) => params && parseInt(params.value))
  id: number;
}

export class GetDepositByIdRestResponse {
  @ApiProperty({
    description: 'Deposit ID.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Process status.',
    examples: ['waiting', 'completed', 'failed'],
  })
  process_status?: string;

  @ApiProperty({
    description: 'Deposit reference.',
    example: '99b22dde-a97d-11ed-afa1-0242ac120002',
  })
  reference: string;

  @ApiPropertyOptional({
    description: 'Deposit main transaction.',
    example: 'acc662aa-9f3b-445f-813d-bcb50e3abbdb',
  })
  main_transaction?: string;

  @ApiProperty({
    description: 'Deposit UUID.',
    example: 'acc662aa-9f3b-445f-813d-bcb50e3abbdb',
  })
  uuid: string;

  @ApiProperty({
    description: 'Deposit description.',
    example: 'Teste',
  })
  description: string;

  @ApiProperty({
    description: 'Deposit payment type.',
    example: 'pix',
  })
  payment_type: string;

  @ApiProperty({
    description: 'Deposit status.',
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'Deposit PIX key type.',
    example: 'EVP',
  })
  type_key_pix: string;

  @ApiProperty({
    description: 'Deposit PIX key.',
    example: '066cf2db-0f74-4d02-99b9-a4e695c6a10a',
  })
  key_pix: string;

  @ApiProperty({
    description: 'Deposit fee value.',
    example: '0,00',
  })
  fee_value: string;

  @ApiProperty({
    description: 'Deposit value.',
    example: '1,99',
  })
  value: string;

  @ApiProperty({
    description: 'Deposit creation date.',
    example: '2022-12-07T20:05:17+00:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Deposit last update.',
    example: '2022-12-07T20:05:17+00:00',
  })
  updated_at: string;

  @ApiProperty({
    description: 'Deposit transaction type.',
    example: 'returned',
  })
  transaction_type: string;

  @ApiPropertyOptional({
    description: 'End to end ID.',
    example: 'E45246410202302032028B8igHrRQcRj',
  })
  end_to_end_id_field?: string;

  @ApiPropertyOptional({
    description: 'Deposit PSP bank name.',
    example: 'Banco psp',
  })
  psp_bank_name?: string;

  @ApiPropertyOptional({
    description: 'Deposit PSP bank ISPB.',
    example: '111111',
  })
  psp_ispb?: string;

  @ApiProperty({
    description: 'Deposit company ID.',
    example: 1,
  })
  company_id: number;

  @ApiPropertyOptional({
    description: 'Deposit instant payment ID field.',
    example: 2,
  })
  instant_payment_id_field?: string;

  @ApiProperty({
    description: 'Deposit error description.',
    example: ErrorDescriptionRestResponse,
  })
  error_description: ErrorDescriptionRestResponse;

  @ApiProperty({
    description: 'Deposit company.',
    example: null,
  })
  company: TCompany;

  @ApiProperty({
    description: 'Deposit client.',
    example: null,
  })
  client: TClient;

  @ApiProperty({
    description: 'Deposit bank.',
    example: null,
  })
  bank: TBank;

  @ApiPropertyOptional({
    description: 'Paid by client.',
    example: null,
  })
  paid_by_client?: TPaidByClient;

  @ApiPropertyOptional()
  kyc?: TKyc;

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
    this.paid_by_client = props.paid_by_client;
    this.kyc = props.kyc;
  }
}

/**
 * GetDepositById controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Deposits')
@Controller('payments-gateway/deposits/:id')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-deposits-by-id')
export class GetDepositByIdRestController {
  /**
   * Get deposit by id endpoint.
   */
  @ApiOperation({
    summary: 'Get deposit by ID.',
    description:
      "Enter the deposit's ID below and execute to get its information.",
  })
  @ApiOkResponse({
    description: 'DepositById found successfully.',
    type: GetDepositByIdRestResponse,
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
    @Param() params: GetDepositByIdParams,
    @KafkaServiceParam(GetDepositByIdServiceKafka)
    service: GetDepositByIdServiceKafka,
    @LoggerParam(GetDepositByIdRestController)
    logger: Logger,
  ): Promise<GetDepositByIdRestResponse> {
    // Creates a payload
    const payload: GetTransactionByIdRequest = {
      wallet_id: wallet.id,
      id: params.id,
    };

    logger.debug('Get deposit by id.', { user, wallet, payload });

    // Call deposit by id service.
    const result = await service.execute(payload);

    logger.debug('Found deposit.', { result });

    const response = result && new GetDepositByIdRestResponse(result);

    return response;
  }
}
