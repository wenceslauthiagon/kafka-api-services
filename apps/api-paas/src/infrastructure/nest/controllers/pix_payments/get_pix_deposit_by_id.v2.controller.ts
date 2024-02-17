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
import { AuthUser, PersonDocumentType } from '@zro/users/domain';
import { PixDepositState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetPixDepositByIdRequest,
  GetPixDepositByIdResponse,
} from '@zro/pix-payments/interface';
import { GetPixDepositByIdServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

export class V2GetPixDepositByIdParams {
  @ApiProperty({
    description: 'Deposit UUID.',
  })
  @IsUUID(4)
  id!: string;
}

export class V2GetPixDepositByIdRestResponse {
  @ApiProperty({
    description: 'Deposit ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Operation ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiProperty({
    enum: PixDepositState,
    description: 'Deposit state.',
    example: PixDepositState.RECEIVED,
  })
  state: PixDepositState;

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
    description: 'Deposit R$ in cents.',
    example: 1299,
  })
  amount!: number;

  @ApiPropertyOptional({
    description: 'The payment owner name.',
  })
  owner_name?: string;

  @ApiProperty({
    description: 'The payment owner person document type.',
    enum: PersonDocumentType,
  })
  owner_person_type!: PersonDocumentType;

  @ApiPropertyOptional({
    description: 'The payment owner document.',
  })
  owner_document?: string;

  @ApiProperty({
    description: 'The payment owner bank name.',
  })
  owner_bank_name!: string;

  @ApiPropertyOptional({
    description: 'The payment owner bank ispb.',
  })
  owner_bank_ispb!: string;

  @ApiPropertyOptional({
    description: 'The payment beneficiary name.',
  })
  beneficiary_name?: string;

  @ApiProperty({
    description: 'The payment beneficiary account number.',
    example: '12376786',
  })
  beneficiary_account_number: string;

  @ApiProperty({
    description: 'The payment beneficiary person document type.',
    enum: PersonDocumentType,
  })
  beneficiary_person_type!: PersonDocumentType;

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

  @ApiProperty({
    description: 'Deposit created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetPixDepositByIdResponse) {
    this.id = props.id;
    this.operation_id = props.operation?.id;
    this.state = props.state;
    this.end_to_end_id = props.endToEndId;
    this.txid = props.txId;
    this.amount = props.amount;
    this.owner_name = props.thirdPartName;
    this.owner_person_type = props.thirdPartPersonType;
    this.owner_document =
      props.thirdPartPersonType === PersonDocumentType.CPF
        ? cpfMask(props.thirdPartDocument)
        : props.thirdPartDocument;
    this.owner_bank_name = props.thirdPartBank?.name;
    this.owner_bank_ispb = props.thirdPartBank?.ispb;
    this.beneficiary_name = props.clientName;
    this.beneficiary_account_number = props.clientAccountNumber;
    this.beneficiary_person_type = props.clientPersonType;
    this.beneficiary_document =
      props.clientPersonType === PersonDocumentType.CPF
        ? cpfMask(props.clientDocument)
        : props.clientDocument;
    this.beneficiary_bank_name = props.clientBank?.name;
    this.beneficiary_bank_ispb = props.clientBank?.ispb;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix deposits controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/deposits/:id')
@HasPermission('api-paas-get-pix-deposits-by-id')
export class V2GetPixDepositByIdRestController {
  /**
   * get by id deposit endpoint.
   */
  @ApiOperation({
    summary: 'Get pix deposit by ID.',
    description:
      "Enter the pix deposit's ID below and execute to get its state and all information.",
  })
  @ApiOkResponse({
    description: 'Deposit.',
    type: V2GetPixDepositByIdRestResponse,
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
    @Param() params: V2GetPixDepositByIdParams,
    @KafkaServiceParam(GetPixDepositByIdServiceKafka)
    service: GetPixDepositByIdServiceKafka,
    @LoggerParam(V2GetPixDepositByIdRestController)
    logger: Logger,
  ): Promise<V2GetPixDepositByIdRestResponse> {
    // Create a payload.
    const payload: GetPixDepositByIdRequest = {
      id: params.id,
      userId: user.uuid,
      walletId: wallet.id,
    };

    logger.debug('Get By id deposit.', { user, payload });

    // Call get payment service.
    const result = await service.execute(payload);

    logger.debug('Deposit result.', { result });

    const response = result && new V2GetPixDepositByIdRestResponse(result);

    return response;
  }
}
