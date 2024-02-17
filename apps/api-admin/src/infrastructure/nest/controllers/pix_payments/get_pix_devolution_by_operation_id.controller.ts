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
import { AuthAdmin } from '@zro/api-admin/domain';
import { PersonDocumentType } from '@zro/users/domain';
import { PixDevolutionState } from '@zro/pix-payments/domain';
import { GetPixDevolutionByOperationIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionByOperationIdRequest,
  GetPixDevolutionByOperationIdResponse,
} from '@zro/pix-payments/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';

export class GetPixDevolutionByOperationIdRestParams {
  @ApiProperty({
    description: 'Operation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class GetPixDevolutionByOperationIdRestResponse {
  @ApiProperty({
    description: 'Devolution ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Value in R$ cents.',
    example: 1299,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'User defined devolution description.',
    example: 'The party devolution.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Error returned when payment failed.',
    example: 'DEVOLUTION_NOT_FOUND',
    required: false,
    nullable: true,
  })
  failed_code?: string;

  @ApiPropertyOptional({
    description: 'Error returned when payment failed.',
    example: 'Devolução não encontrado.',
    required: false,
    nullable: true,
  })
  failed_message?: string;

  @ApiProperty({
    enum: PixDevolutionState,
    description: 'Devolution state.',
    example: PixDevolutionState.CONFIRMED,
  })
  state: PixDevolutionState;

  @ApiProperty({
    description: 'Devolution created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'Opeation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiProperty({
    description: 'Devolution beneficiary bank name.',
  })
  beneficiary_bank_name: string;

  @ApiProperty({
    description: 'Devolution beneficiary bank ispb.',
  })
  beneficiary_bank_ispb: string;

  @ApiProperty({
    description: 'Devolution beneficiary branch (bank agency).',
  })
  beneficiary_branch: string;

  @ApiProperty({
    description: 'Devolution beneficiary account type.',
  })
  beneficiary_account_type: string;

  @ApiProperty({
    description: 'Devolution beneficiary account number.',
  })
  beneficiary_account_number: string;

  @ApiProperty({
    enum: PersonDocumentType,
    description: 'Devolution beneficiary person type.',
    example: PersonDocumentType.CPF,
  })
  beneficiary_person_type: PersonDocumentType;

  @ApiProperty({
    description: 'Devolution beneficiary document (cpf or cnpj).',
  })
  beneficiary_document: string;

  @ApiProperty({
    description: 'Devolution beneficiary name.',
  })
  beneficiary_name: string;

  @ApiProperty({
    description: 'Devolution beneficiary name.',
  })
  beneficiary_key: string;

  @ApiProperty({
    description: 'Devolution owner bank name.',
  })
  owner_bank_name: string;

  @ApiProperty({
    description: 'Devolution owner bank ispb.',
  })
  owner_bank_ispb: string;

  @ApiProperty({
    description: 'Devolution owner branch (bank agency).',
  })
  owner_branch: string;

  @ApiProperty({
    description: 'Devolution owner account number.',
  })
  owner_account_number: string;

  @ApiProperty({
    enum: PersonDocumentType,
    description: 'Devolution owner person document type.',
    example: PersonDocumentType.CPF,
  })
  owner_person_type: PersonDocumentType;

  @ApiProperty({
    description: 'Devolution owner document (cpf or cnpj).',
  })
  owner_document: string;

  @ApiProperty({
    description: 'Devolution owner name.',
  })
  owner_name: string;

  @ApiProperty({
    description: 'Devolution owner name.',
  })
  owner_key: string;

  constructor(props: GetPixDevolutionByOperationIdResponse) {
    this.id = props.id;
    this.amount = props.amount;
    this.description = props.description;
    this.failed_code = props.failed?.code;
    this.failed_message = props.failed?.message;
    this.state = props.state;
    this.operation_id = props.operationId;
    this.owner_account_number = props.deposit?.clientAccountNumber;
    this.owner_bank_name = props.deposit?.clientBank?.name;
    this.owner_bank_ispb = props.deposit?.clientBank?.ispb;
    this.owner_branch = props.deposit?.clientBranch;
    this.owner_document = props.deposit?.clientDocument;
    this.owner_key = props.deposit?.clientKey;
    this.owner_name = props.deposit?.clientName;
    this.owner_person_type = props.deposit?.clientPersonType;
    this.beneficiary_account_number = props.deposit?.thirdPartAccountNumber;
    this.beneficiary_account_type = props.deposit?.thirdPartAccountType;
    this.beneficiary_bank_name = props.deposit?.thirdPartBank.name;
    this.beneficiary_bank_ispb = props.deposit?.thirdPartBank.ispb;
    this.beneficiary_branch = props.deposit?.thirdPartBranch;
    this.beneficiary_document = props.deposit?.thirdPartDocument;
    this.beneficiary_key = props.deposit?.thirdPartKey;
    this.beneficiary_name = props.deposit?.thirdPartName;
    this.beneficiary_person_type = props.deposit?.thirdPartPersonType;
    this.created_at = props.createdAt;
  }
}

/**
 * GetPixDevolutionByOperationId controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@Controller('pix/devolutions/by-operation/:id')
export class GetPixDevolutionByOperationIdRestController {
  @ApiOperation({
    summary: 'Get devolution by operation id.',
  })
  @ApiOkResponse({
    description: 'Devolution found by operation id successfully.',
    type: GetPixDevolutionByOperationIdRestResponse,
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
    @Param() params: GetPixDevolutionByOperationIdRestParams,
    @KafkaServiceParam(GetPixDevolutionByOperationIdServiceKafka)
    service: GetPixDevolutionByOperationIdServiceKafka,
    @LoggerParam(GetPixDevolutionByOperationIdRestController)
    logger: Logger,
  ): Promise<GetPixDevolutionByOperationIdRestResponse> {
    // Creates a payload
    const payload: GetPixDevolutionByOperationIdRequest = {
      operationId: params.id,
    };

    logger.debug('Getting devolution by operation id.', { admin, payload });

    // Calls getPixDevolutionByOperationId service.
    const result = await service.execute(payload);

    logger.debug('Devolution result.', { result });

    const response =
      result && new GetPixDevolutionByOperationIdRestResponse(result);

    return response;
  }
}
