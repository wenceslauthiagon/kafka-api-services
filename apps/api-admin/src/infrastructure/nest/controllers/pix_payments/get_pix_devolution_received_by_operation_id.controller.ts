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
} from '@nestjs/swagger';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { PersonDocumentType } from '@zro/users/domain';
import { PixDevolutionReceivedState } from '@zro/pix-payments/domain';
import { GetPixDevolutionReceivedByOperationIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionReceivedByOperationIdRequest,
  GetPixDevolutionReceivedByOperationIdResponse,
} from '@zro/pix-payments/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';

export class GetPixDevolutionReceivedByOperationIdRestParams {
  @ApiProperty({
    description: 'Operation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class GetPixDevolutionReceivedByOperationIdRestResponse {
  @ApiProperty({
    description: 'DevolutionReceived ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    enum: PixDevolutionReceivedState,
    description: 'DevolutionReceived state.',
    example: PixDevolutionReceivedState.READY,
  })
  state: PixDevolutionReceivedState;

  @ApiProperty({
    description: 'DevolutionReceived amount.',
    example: 1299,
  })
  amount: number;

  @ApiProperty({
    description: 'DevolutionReceived endToEndId.',
  })
  end_to_end_id: string;

  @ApiProperty({
    description: 'DevolutionReceived beneficiary bank name.',
  })
  beneficiary_bank_name: string;

  @ApiProperty({
    description: 'DevolutionReceived beneficiary bank ispb.',
  })
  beneficiary_bank_ispb: string;

  @ApiProperty({
    description: 'DevolutionReceived beneficiary branch (bank agency).',
  })
  beneficiary_branch: string;

  @ApiProperty({
    description: 'DevolutionReceived beneficiary account type.',
  })
  beneficiary_account_type: string;

  @ApiProperty({
    description: 'DevolutionReceived beneficiary account number.',
  })
  beneficiary_account_number: string;

  @ApiProperty({
    enum: PersonDocumentType,
    description: 'DevolutionReceived beneficiary person type.',
    example: PersonDocumentType.CPF,
  })
  beneficiary_person_type: PersonDocumentType;

  @ApiProperty({
    description: 'DevolutionReceived beneficiary document (cpf or cnpj).',
  })
  beneficiary_document: string;

  @ApiProperty({
    description: 'DevolutionReceived beneficiary name.',
  })
  beneficiary_name: string;

  @ApiProperty({
    description: 'DevolutionReceived beneficiary name.',
  })
  beneficiary_key: string;

  @ApiProperty({
    description: 'DevolutionReceived owner bank name.',
  })
  owner_bank_name: string;

  @ApiProperty({
    description: 'DevolutionReceived owner bank ispb.',
  })
  owner_bank_ispb: string;

  @ApiProperty({
    description: 'DevolutionReceived owner branch (bank agency).',
  })
  owner_branch: string;

  @ApiProperty({
    description: 'DevolutionReceived owner account number.',
  })
  owner_account_number: string;

  @ApiProperty({
    enum: PersonDocumentType,
    description: 'DevolutionReceived owner person document type.',
    example: PersonDocumentType.CPF,
  })
  owner_person_type: PersonDocumentType;

  @ApiProperty({
    description: 'DevolutionReceived owner document (cpf or cnpj).',
  })
  owner_document: string;

  @ApiProperty({
    description: 'DevolutionReceived owner name.',
  })
  owner_name: string;

  @ApiProperty({
    description: 'DevolutionReceived owner name.',
  })
  owner_key: string;

  @ApiProperty({
    description: 'User Id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  user_id: string;

  @ApiProperty({
    description: 'Operation Id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiProperty({
    description: 'Payment Id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  payment_id: string;

  @ApiProperty({
    description: 'DevolutionReceived created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetPixDevolutionReceivedByOperationIdResponse) {
    this.id = props.id;
    this.state = props.state;
    this.amount = props.amount;
    this.end_to_end_id = props.endToEndId;
    this.owner_account_number = props.thirdPartAccountNumber;
    this.owner_bank_name = props.thirdPartBank?.name;
    this.owner_bank_ispb = props.thirdPartBank?.ispb;
    this.owner_branch = props.thirdPartBranch;
    this.owner_document = props.thirdPartDocument;
    this.owner_key = props.thirdPartKey;
    this.owner_name = props.thirdPartName;
    this.owner_person_type = props.thirdPartPersonType;
    this.beneficiary_account_number = props.clientAccountNumber;
    this.beneficiary_account_type = props.thirdPartAccountType;
    this.beneficiary_bank_name = props.clientBank.name;
    this.beneficiary_bank_ispb = props.clientBank.ispb;
    this.beneficiary_branch = props.clientBranch;
    this.beneficiary_document = props.clientDocument;
    this.beneficiary_key = props.clientKey;
    this.beneficiary_name = props.clientName;
    this.beneficiary_person_type = props.clientPersonType;
    this.user_id = props.userId;
    this.operation_id = props.operationId;
    this.payment_id = props.paymentId;
    this.created_at = props.createdAt;
  }
}

/**
 * GetPixDevolutionReceivedByOperationId controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@Controller('pix/devolution-received/by-operation/:id')
export class GetPixDevolutionReceivedByOperationIdRestController {
  @ApiOperation({
    summary: 'Get devolutionReceived by operation id.',
  })
  @ApiOkResponse({
    description: 'DevolutionReceived found by operation id successfully.',
    type: GetPixDevolutionReceivedByOperationIdRestResponse,
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
    @Param() params: GetPixDevolutionReceivedByOperationIdRestParams,
    @KafkaServiceParam(GetPixDevolutionReceivedByOperationIdServiceKafka)
    service: GetPixDevolutionReceivedByOperationIdServiceKafka,
    @LoggerParam(GetPixDevolutionReceivedByOperationIdRestController)
    logger: Logger,
  ): Promise<GetPixDevolutionReceivedByOperationIdRestResponse> {
    // Creates a payload
    const payload: GetPixDevolutionReceivedByOperationIdRequest = {
      operationId: params.id,
    };

    logger.debug('Getting devolutionReceived by operation id.', {
      admin,
      payload,
    });

    // Calls getPixDevolutionReceivedByOperationId service.
    const result = await service.execute(payload);

    logger.debug('DevolutionReceived result.', { result });

    const response =
      result && new GetPixDevolutionReceivedByOperationIdRestResponse(result);

    return response;
  }
}
