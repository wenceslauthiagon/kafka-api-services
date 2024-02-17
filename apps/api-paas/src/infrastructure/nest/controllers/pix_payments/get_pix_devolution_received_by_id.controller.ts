import { Controller, Param, Get } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { Logger } from 'winston';
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
import { PixDevolutionReceivedState } from '@zro/pix-payments/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetPixDevolutionReceivedByIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionReceivedByIdRequest,
  GetPixDevolutionReceivedByIdResponse,
} from '@zro/pix-payments/interface';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

export class GetByPixDevolutionReceivedIdParams {
  @ApiProperty({
    description: 'Devolution Received ID.',
  })
  @IsUUID(4)
  id: string;
}

export class GetByPixDevolutionReceivedIdRestResponse {
  @ApiProperty({
    description: 'Devolution ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'User defined devolution description.',
    example: 'The party devolution received.',
  })
  description?: string;

  @ApiProperty({
    enum: PixDevolutionReceivedState,
    description: 'Devolution state.',
    example: PixDevolutionReceivedState.READY,
  })
  state: PixDevolutionReceivedState;

  @ApiProperty({
    description:
      'Operation UUID. Used to get receipt and track the transaction.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiPropertyOptional({
    description: 'End to End ID.',
  })
  end_to_end_id?: string;

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
  amount: number;

  @ApiPropertyOptional({
    description: 'The payment owner name.',
  })
  owner_name?: string;

  @ApiProperty({
    description: 'The payment owner person type.',
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
    description: 'The payment beneficiary name.',
  })
  beneficiary_name?: string;

  @ApiProperty({
    description: 'The payment beneficiary person type.',
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

  @ApiProperty({
    description: 'Devolution received created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetPixDevolutionReceivedByIdResponse) {
    this.id = props.id;
    this.state = props.state;
    this.description = props.description;
    this.operation_id = props.operationId;
    this.end_to_end_id = props.endToEndId;
    this.txid = props.txId;
    this.amount = props.amount;
    this.owner_name = props.thirdPartName;
    this.owner_person_type = props.thirdPartPersonType;
    this.owner_document =
      props.thirdPartPersonType === PersonDocumentType.CPF
        ? cpfMask(props.thirdPartDocument)
        : props.thirdPartDocument;
    this.owner_bank_name = props.thirdPartBankName;
    this.beneficiary_name = props.clientName;
    this.beneficiary_person_type = props.clientPersonType;
    this.beneficiary_document =
      props.clientPersonType === PersonDocumentType.CPF
        ? cpfMask(props.clientDocument)
        : props.clientDocument;
    this.beneficiary_bank_name = props.clientBankName;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix devolutions received controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/devolutions-received/:id')
@HasPermission('api-paas-get-pix-devolutions-received-by-id')
export class GetByIdPixDevolutionReceivedRestController {
  /**
   * get devolution recieved endpoint.
   */
  @ApiOperation({
    summary: 'Get received pix devolution by ID.',
    description:
      "Enter the received pix devolution's ID below and execute to get its state and all information.",
  })
  @ApiOkResponse({
    description: 'The PIX devolution received returned successfully.',
    type: GetByPixDevolutionReceivedIdRestResponse,
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
    @KafkaServiceParam(GetPixDevolutionReceivedByIdServiceKafka)
    service: GetPixDevolutionReceivedByIdServiceKafka,
    @LoggerParam(GetByIdPixDevolutionReceivedRestController)
    logger: Logger,
    @Param() params: GetByPixDevolutionReceivedIdParams,
  ): Promise<GetByPixDevolutionReceivedIdRestResponse> {
    // GetById a payload.
    const payload: GetPixDevolutionReceivedByIdRequest = {
      id: params.id,
      userId: user.uuid,
      walletId: wallet.id,
    };

    logger.debug('GetById devolution received.', { user, payload });

    // Call create devolution service.
    const result = await service.execute(payload);

    logger.debug('DevolutionReceived received.', { result });

    const response =
      result && new GetByPixDevolutionReceivedIdRestResponse(result);

    return response;
  }
}
