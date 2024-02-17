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
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import {
  AccountType,
  PaymentState,
  PaymentType,
} from '@zro/pix-payments/domain';
import {
  GetPaymentByOperationIdResponse,
  GetPaymentByOperationIdRequest,
} from '@zro/pix-payments/interface';
import { GetPaymentByOperationIdServiceKafka } from '@zro/pix-payments/infrastructure';
import { PersonType } from '@zro/users/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { AuthAdmin } from '@zro/api-admin/domain';

export class GetPaymentByOperationIdParams {
  @ApiProperty({
    description: 'Operation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id: string;
}

class GetPaymentByOperationIdRestResponse {
  @ApiProperty({
    description: 'Payment id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'Payment associated operation id.',
  })
  operation_id?: string;

  @ApiProperty({
    enum: PaymentState,
    description: 'Payment state.',
    example: PaymentState.SCHEDULED,
  })
  state: PaymentState;

  @ApiProperty({
    enum: PaymentType,
    description: 'Payment type.',
    example: PaymentType.ACCOUNT,
  })
  payment_type: PaymentType;

  @ApiProperty({
    description: 'Payment amount.',
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Payment end to end id.',
  })
  end_to_end_id?: string;

  @ApiPropertyOptional({
    description: 'Payment date.',
  })
  payment_date?: Date;

  @ApiPropertyOptional({
    description: 'Payment description.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Payment tx id.',
  })
  txid?: string;

  @ApiPropertyOptional({
    description: 'Payment key.',
  })
  key?: string;

  @ApiProperty({
    enum: AccountType,
    description: 'Payment beneficiary account type.',
    example: AccountType.SLRY,
  })
  beneficiary_account_type: AccountType;

  @ApiProperty({
    enum: PersonType,
    description: 'Payment beneficiary person type.',
    example: PersonType.LEGAL_PERSON,
  })
  beneficiary_person_type: PersonType;

  @ApiProperty({
    description: 'Payment beneficiary branch (bank agency).',
  })
  beneficiary_branch: string;

  @ApiProperty({
    description: 'Payment beneficiary account number.',
  })
  beneficiary_account_number: string;

  @ApiPropertyOptional({
    description: 'Payment beneficiary bank name.',
  })
  beneficiary_bank_name?: string;

  @ApiProperty({
    description: 'Payment beneficiary bank ispb.',
  })
  beneficiary_bank_ispb: string;

  @ApiProperty({
    description: 'Payment beneficiary document (cpf or cnpj).',
  })
  beneficiary_document: string;

  @ApiProperty({
    description: 'Payment beneficiary name.',
  })
  beneficiary_key: string;

  @ApiPropertyOptional({
    description: 'Payment beneficiary name.',
  })
  beneficiary_name?: string;

  @ApiProperty({
    description: 'Payment associated user id.',
  })
  user_id: string;

  @ApiProperty({
    description: 'Payment owner account number.',
  })
  owner_account_number: string;

  @ApiProperty({
    enum: PersonType,
    description: 'Payment owner person type.',
    example: PersonType.NATURAL_PERSON,
  })
  owner_person_type: PersonType;

  @ApiProperty({
    description: 'Payment owner branch.',
  })
  owner_branch: string;

  @ApiProperty({
    description: 'Payment owner document (cpf or cnpj).',
  })
  owner_document: string;

  @ApiProperty({
    description: 'Payment owner name.',
  })
  owner_name: string;

  @ApiProperty({
    description: 'Payment transaction tag.',
  })
  transaction_tag: string;

  @ApiPropertyOptional({
    description: 'Error returned when payment failed.',
    example: 'PAYMENT_NOT_FOUND',
    required: false,
    nullable: true,
  })
  failed_code?: string;

  @ApiPropertyOptional({
    description: 'Error returned when payment failed.',
    example: 'Pagamento não encontrado.',
    required: false,
    nullable: true,
  })
  failed_message?: string;

  @ApiProperty({
    description: 'Payment created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Payment updated at.',
    example: new Date(),
  })
  updated_at: Date;

  constructor(props: GetPaymentByOperationIdResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.state = props.state;
    this.amount = props.value;
    this.end_to_end_id = props.endToEndId;
    this.payment_date = props.paymentDate;
    this.description = props.description;
    this.txid = props.txId;
    this.key = props.key;
    this.transaction_tag = props.transactionTag;
    this.payment_type = props.paymentType;
    this.owner_branch = props.ownerBranch;
    this.owner_document = props.ownerDocument;
    this.owner_name = props.ownerFullName;
    this.owner_person_type = props.ownerPersonType;
    this.beneficiary_account_number = props.beneficiaryAccountNumber;
    this.beneficiary_account_type = props.beneficiaryAccountType;
    this.beneficiary_bank_name = props.beneficiaryBankName;
    this.beneficiary_bank_ispb = props.beneficiaryBankIspb;
    this.beneficiary_branch = props.beneficiaryBranch;
    this.beneficiary_document = props.beneficiaryDocument;
    this.beneficiary_key = props.key;
    this.beneficiary_name = props.beneficiaryName;
    this.beneficiary_person_type = props.beneficiaryPersonType;
    this.user_id = props.userId;
    this.failed_code = props.failed?.code;
    this.failed_message = props.failed?.message;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

/**
 * Payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@Controller('pix/payments/by-operation/:id')
export class GetPaymentByOperationIdRestController {
  /**
   * Get by operation id payment endpoint.
   */
  @ApiOperation({
    summary: 'Get a PIX payment status.',
  })
  @ApiOkResponse({
    description: 'Payment received.',
    type: GetPaymentByOperationIdResponse,
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
    @AuthAdminParam() admin: AuthAdmin,
    @Param() params: GetPaymentByOperationIdParams,
    @KafkaServiceParam(GetPaymentByOperationIdServiceKafka)
    service: GetPaymentByOperationIdServiceKafka,
    @LoggerParam(GetPaymentByOperationIdRestController)
    logger: Logger,
  ): Promise<GetPaymentByOperationIdRestResponse> {
    // GetPaymentByOperationId payload.
    const payload: GetPaymentByOperationIdRequest = {
      operationId: params.id,
    };

    logger.debug('Get by operation id payments.', { admin, payload });

    // Call get payment  by operation id service.
    const result = await service.execute(payload);

    logger.debug('Payments found.', { result });

    const response = result && new GetPaymentByOperationIdRestResponse(result);

    return response;
  }
}
