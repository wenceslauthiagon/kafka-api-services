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
import { GetRefundByIdServiceKafka } from '@zro/payments-gateway/infrastructure';
import {
  GetTransactionByIdRequest,
  TransactionResponseItem,
  TBank,
  TClient,
  TCompany,
} from '@zro/payments-gateway/interface';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { ErrorDescriptionRestResponse } from './default';

export class GetRefundByIdParams {
  @ApiProperty({
    description: 'Refund ID.',
  })
  @IsPositive()
  @Transform((params) => params && parseInt(params.value))
  id: number;
}

export class GetRefundByIdRestResponse {
  @ApiProperty({
    description: 'Refund ID.',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Process status.',
    examples: ['waiting', 'completed', 'failed'],
  })
  process_status?: string;

  @ApiProperty({
    description: 'Refund reference.',
    example: '99b22dde-a97d-11ed-afa1-0242ac120002',
  })
  reference: string;

  @ApiPropertyOptional({
    description: 'Refund main transaction.',
    example: 'acc662aa-9f3b-445f-813d-bcb50e3abbdb',
  })
  main_transaction?: string;

  @ApiProperty({
    description: 'Refund UUID.',
    example: 'acc662aa-9f3b-445f-813d-bcb50e3abbdb',
  })
  uuid: string;

  @ApiProperty({
    description: 'Refund description.',
    example: 'Teste',
  })
  description: string;

  @ApiProperty({
    description: 'Refund payment type.',
    example: 'pix',
  })
  payment_type: string;

  @ApiProperty({
    description: 'Refund status.',
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'Refund PIX key type.',
    example: 'EVP',
  })
  type_key_pix: string;

  @ApiProperty({
    description: 'Refund PIX key.',
    example: '066cf2db-0f74-4d02-99b9-a4e695c6a10a',
  })
  key_pix: string;

  @ApiProperty({
    description: 'Refund fee value.',
    example: '0,00',
  })
  fee_value: string;

  @ApiProperty({
    description: 'Refund value.',
    example: '1,99',
  })
  value: string;

  @ApiProperty({
    description: 'Refund creation date.',
    example: '2022-12-07T20:05:17+00:00',
  })
  created_at: string;

  @ApiProperty({
    description: 'Refund last update.',
    example: '2022-12-07T20:05:17+00:00',
  })
  updated_at: string;

  @ApiProperty({
    description: 'Refund transaction type.',
    example: 'returned',
  })
  transaction_type: string;

  @ApiPropertyOptional({
    description: 'End to end ID.',
    example: 'E45246410202302032028B8igHrRQcRj',
  })
  end_to_end_id_field?: string;

  @ApiPropertyOptional({
    description: 'Refund PSP bank name.',
    example: 'Banco psp',
  })
  psp_bank_name?: string;

  @ApiPropertyOptional({
    description: 'Refund PSP bank ISPB.',
    example: '111111',
  })
  psp_ispb?: string;

  @ApiProperty({
    description: 'Refund company ID.',
    example: 1,
  })
  company_id: number;

  @ApiPropertyOptional({
    description: 'Refund instant payment ID field.',
    example: 2,
  })
  instant_payment_id_field?: string;

  @ApiProperty({
    description: 'Refund error description.',
    example: ErrorDescriptionRestResponse,
  })
  error_description: ErrorDescriptionRestResponse;

  @ApiProperty({
    description: 'Refund company.',
    example: null,
  })
  company: TCompany;

  @ApiProperty({
    description: 'Refund client.',
    example: null,
  })
  client: TClient;

  @ApiProperty({
    description: 'Refund bank.',
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
  }
}

/**
 * GetRefundById controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Refunds')
@Controller('payments-gateway/refunds/:id')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-refunds-by-id')
export class GetRefundByIdRestController {
  /**
   * Get refund by id endpoint.
   */
  @ApiOperation({
    summary: 'Get refund by ID.',
    description:
      "Enter the refund's ID below and execute to get its information.",
  })
  @ApiOkResponse({
    description: 'RefundById found successfully.',
    type: GetRefundByIdRestResponse,
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
    @Param() params: GetRefundByIdParams,
    @KafkaServiceParam(GetRefundByIdServiceKafka)
    service: GetRefundByIdServiceKafka,
    @LoggerParam(GetRefundByIdRestController)
    logger: Logger,
  ): Promise<GetRefundByIdRestResponse> {
    // Creates a payload
    const payload: GetTransactionByIdRequest = {
      wallet_id: wallet.id,
      id: params.id,
    };

    logger.debug('Get refund by id.', { user, wallet, payload });

    // Call refund by id service.
    const result = await service.execute(payload);

    logger.debug('Found refund.', { result });

    const response = result && new GetRefundByIdRestResponse(result);

    return response;
  }
}
