import { Controller, Param, Get, Version } from '@nestjs/common';
import { Logger } from 'winston';
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
  cpfMask,
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
} from '@zro/common';
import { AuthUser, PersonType } from '@zro/users/domain';
import { PaymentState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetPaymentByIdRequest,
  GetPaymentByIdResponse,
} from '@zro/pix-payments/interface';
import { GetPaymentByIdServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

export class V2GetPaymentByIdParams {
  @ApiProperty({
    description: 'Payment UUID.',
  })
  @IsUUID(4)
  id!: string;
}

export class V2GetPaymentByIdRestResponse {
  @ApiProperty({
    description: 'Payment UUID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiPropertyOptional({
    description:
      'Operation UUID. Used to get receipt and track the transaction. This will not be returned if the payment has been scheduled.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: false,
  })
  operation_id?: string;

  @ApiProperty({
    enum: PaymentState,
    description: 'Payment state.',
    example: PaymentState.PENDING,
  })
  state!: PaymentState;

  @ApiProperty({
    description: 'End to end id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  end_to_end_id!: string;

  @ApiPropertyOptional({
    description: 'Payment txid identifier.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: false,
  })
  txid?: string;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  amount!: number;

  @ApiPropertyOptional({
    description: 'The payment owner name.',
  })
  owner_name?: string;

  @ApiProperty({
    description: 'The payment owner person type.',
    enum: PersonType,
  })
  owner_person_type!: PersonType;

  @ApiPropertyOptional({
    description: 'The payment owner document.',
  })
  owner_document?: string;

  @ApiPropertyOptional({
    description: 'The payment owner account number.',
  })
  owner_account_number?: string;

  @ApiPropertyOptional({
    description: 'The payment owner branch.',
  })
  owner_branch?: string;

  @ApiPropertyOptional({
    description: 'The payment beneficiary name.',
  })
  beneficiary_name?: string;

  @ApiProperty({
    description: 'The payment beneficiary person type.',
    enum: PersonType,
  })
  beneficiary_person_type!: PersonType;

  @ApiPropertyOptional({
    description: 'The payment beneficiary document.',
  })
  beneficiary_document?: string;

  @ApiProperty({
    description: 'The payment beneficiary bank name.',
  })
  beneficiary_bank_name!: string;

  @ApiPropertyOptional({
    description: 'The payment beneficiary bank ispb.',
  })
  beneficiary_bank_ispb!: string;

  @ApiPropertyOptional({
    description:
      'Schedule a day to execute payment. Use null to send payment right now.',
    example: null,
    required: false,
    nullable: true,
  })
  payment_date?: Date;

  @ApiPropertyOptional({
    description: 'User defined payment description.',
    required: false,
    nullable: true,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Error returned when payment is reverted.',
    example:
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    required: false,
    nullable: true,
  })
  failed_message?: string;

  @ApiProperty({
    description: 'Payment created date.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: GetPaymentByIdResponse) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.state = props.state;
    this.end_to_end_id = props.endToEndId;
    this.txid = props.txId;
    this.amount = props.value;
    this.owner_name = props.ownerFullName;
    this.owner_person_type = props.ownerPersonType;
    this.owner_document =
      props.ownerPersonType === PersonType.NATURAL_PERSON
        ? cpfMask(props.ownerDocument)
        : props.ownerDocument;
    this.owner_account_number = props.ownerAccountNumber;
    this.owner_branch = props.ownerBranch;
    this.beneficiary_name = props.beneficiaryName;
    this.beneficiary_person_type = props.beneficiaryPersonType;
    this.beneficiary_document =
      props.beneficiaryPersonType === PersonType.NATURAL_PERSON
        ? cpfMask(props.beneficiaryDocument)
        : props.beneficiaryDocument;
    this.beneficiary_bank_name = props.beneficiaryBankName;
    this.beneficiary_bank_ispb = props.beneficiaryBankIspb;
    this.payment_date = props.paymentDate;
    this.description = props.description;
    this.created_at = props.createdAt;
    this.failed_message = props.failed?.message;
  }
}

/**
 * User pix payments controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Payments')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/payments/:id')
@HasPermission('api-paas-get-pix-payments-by-id')
export class V2GetPaymentByIdRestController {
  /**
   * get by id payment endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: 'Get pix payment by ID.',
    description:
      "Enter the pix payment's ID below and execute to get its state and all information.",
  })
  @ApiOkResponse({
    description: 'Payment received.',
    type: V2GetPaymentByIdRestResponse,
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
  @Version('2')
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Param() params: V2GetPaymentByIdParams,
    @KafkaServiceParam(GetPaymentByIdServiceKafka)
    service: GetPaymentByIdServiceKafka,
    @LoggerParam(V2GetPaymentByIdRestController)
    logger: Logger,
  ): Promise<V2GetPaymentByIdRestResponse> {
    // Create a payload.
    const payload: GetPaymentByIdRequest = {
      id: params.id,
      userId: user.uuid,
      walletId: wallet.id,
    };

    logger.debug('Get By id payment.', { user, payload });

    // Call get payment service.
    const result = await service.execute(payload);

    logger.debug('Payment result.', { result });

    const response = result && new V2GetPaymentByIdRestResponse(result);

    return response;
  }
}
