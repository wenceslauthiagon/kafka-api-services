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
import { PixDepositState } from '@zro/pix-payments/domain';
import { GetPixDepositByOperationIdServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  GetPixDepositByOperationIdRequest,
  GetPixDepositByOperationIdResponse,
} from '@zro/pix-payments/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';

export class GetPixDepositByOperationIdRestParams {
  @ApiProperty({
    description: 'Operation id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class GetPixDepositByOperationIdRestResponse {
  @ApiProperty({
    description: 'Deposit ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Deposit amount.',
    example: 1299,
  })
  amount: number;

  @ApiProperty({
    description: 'Deposit available amount.',
    example: 1299,
  })
  available_amount: number;

  @ApiProperty({
    enum: PixDepositState,
    description: 'Deposit state.',
    example: PixDepositState.RECEIVED,
  })
  state: PixDepositState;

  @ApiProperty({
    description: 'Deposit beneficiary bank name.',
  })
  beneficiary_bank_name: string;

  @ApiProperty({
    description: 'Deposit beneficiary bank ispb.',
  })
  beneficiary_bank_ispb: string;

  @ApiProperty({
    description: 'Deposit beneficiary branch (bank agency).',
  })
  beneficiary_branch: string;

  @ApiProperty({
    description: 'Deposit beneficiary account type.',
  })
  beneficiary_account_type: string;

  @ApiProperty({
    description: 'Deposit beneficiary account number.',
  })
  beneficiary_account_number: string;

  @ApiProperty({
    enum: PersonDocumentType,
    description: 'Deposit beneficiary person type.',
    example: PersonDocumentType.CPF,
  })
  beneficiary_person_type: PersonDocumentType;

  @ApiProperty({
    description: 'Deposit beneficiary document (cpf or cnpj).',
  })
  beneficiary_document: string;

  @ApiProperty({
    description: 'Deposit beneficiary name.',
  })
  beneficiary_name: string;

  @ApiProperty({
    description: 'Deposit beneficiary name.',
  })
  beneficiary_key: string;

  @ApiProperty({
    description: 'Deposit owner bank name.',
  })
  owner_bank_name: string;

  @ApiProperty({
    description: 'Deposit owner bank ispb.',
  })
  owner_bank_ispb: string;

  @ApiProperty({
    description: 'Deposit owner branch (bank agency).',
  })
  owner_branch: string;

  @ApiProperty({
    description: 'Deposit owner account number.',
  })
  owner_account_number: string;

  @ApiProperty({
    enum: PersonDocumentType,
    description: 'Deposit owner person document type.',
    example: PersonDocumentType.CPF,
  })
  owner_person_type: PersonDocumentType;

  @ApiProperty({
    description: 'Deposit owner document (cpf or cnpj).',
  })
  owner_document: string;

  @ApiProperty({
    description: 'Deposit owner name.',
  })
  owner_name: string;

  @ApiProperty({
    description: 'Deposit owner name.',
  })
  owner_key: string;

  @ApiProperty({
    description: 'User Id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  user_id: string;

  @ApiProperty({
    description: 'Deposit created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetPixDepositByOperationIdResponse) {
    this.id = props.id;
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
    this.amount = props.amount;
    this.available_amount = props.availableAmount;
    this.state = props.state;
    this.user_id = props.userId;
    this.created_at = props.createdAt;
  }
}

/**
 * GetPixDepositByOperationId controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@Controller('pix/deposits/by-operation/:id')
export class GetPixDepositByOperationIdRestController {
  @ApiOperation({
    summary: 'Get deposit by operation id.',
  })
  @ApiOkResponse({
    description: 'Deposit found by operation id successfully.',
    type: GetPixDepositByOperationIdRestResponse,
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
    @Param() params: GetPixDepositByOperationIdRestParams,
    @KafkaServiceParam(GetPixDepositByOperationIdServiceKafka)
    service: GetPixDepositByOperationIdServiceKafka,
    @LoggerParam(GetPixDepositByOperationIdRestController)
    logger: Logger,
  ): Promise<GetPixDepositByOperationIdRestResponse> {
    // Creates a payload
    const payload: GetPixDepositByOperationIdRequest = {
      operationId: params.id,
    };

    logger.debug('Getting deposit by operation id.', { admin, payload });

    // Calls getPixDepositByOperationId service.
    const result = await service.execute(payload);

    logger.debug('Deposit result.', { result });

    const response =
      result && new GetPixDepositByOperationIdRestResponse(result);

    return response;
  }
}
