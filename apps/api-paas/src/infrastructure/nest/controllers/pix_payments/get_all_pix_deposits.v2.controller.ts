import { Logger } from 'winston';
import { Controller, Get, Query, Version } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
import { Transform } from 'class-transformer';
import {
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  cpfMask,
  HasPermission,
  DefaultApiHeaders,
} from '@zro/common';
import { PixDepositState } from '@zro/pix-payments/domain';
import { PersonDocumentType, AuthUser } from '@zro/users/domain';
import {
  GetAllPixDepositByWalletResponseItem,
  GetAllPixDepositByWalletResponse,
  GetAllPixDepositByWalletRequest,
  GetAllPixDepositByWalletRequestSort,
} from '@zro/pix-payments/interface';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetAllPixDepositByWalletServiceKafka } from '@zro/pix-payments/infrastructure';
import { V2WebhookType } from '@zro/api-paas/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

class V2GetAllPixDepositParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPixDepositByWalletRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPixDepositByWalletRequestSort)
  sort?: PaginationSort;

  @ApiPropertyOptional({
    description: 'Created at period date start for any transaction.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateBeforeThan('created_at_period_end', false)
  created_at_period_start?: Date;

  @ApiPropertyOptional({
    description: 'Created at period date end for any transaction.',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD')
  @IsDateAfterThan('created_at_period_start', false)
  created_at_period_end?: Date;

  @ApiPropertyOptional({
    description: 'PixDeposit end to end id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end_id?: string;

  @ApiPropertyOptional({
    description: 'PixDeposit client document.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_document?: string;

  @ApiPropertyOptional({
    enum: PixDepositState,
    description: 'PixDeposit State.',
    example: [PixDepositState.ERROR, PixDepositState.RECEIVED],
    isArray: true,
  })
  @Transform((params) => {
    if (!params.value) return null;
    return Array.isArray(params.value) ? params.value : [params.value];
  })
  @IsOptional()
  @IsEnum(PixDepositState, { each: true })
  states?: PixDepositState[];
}

class V2GetAllPixDepositRestResponseItem {
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
    description: 'Transaction type.',
    enum: V2WebhookType,
  })
  type!: V2WebhookType;

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

  @ApiProperty({
    description: 'Deposit available amount.',
    example: 1299,
  })
  available_amount!: number;

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

  @ApiPropertyOptional({
    description: 'The payment owner account number.',
  })
  owner_account_number?: string;

  @ApiPropertyOptional({
    description: 'The payment owner branch.',
  })
  owner_branch?: string;

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

  constructor(props: GetAllPixDepositByWalletResponseItem) {
    this.id = props.id;
    this.operation_id = props.operationId;
    this.type = V2WebhookType.DEPOSIT_RECEIVED;
    this.state = props.state;
    this.end_to_end_id = props.endToEndId;
    this.txid = props.txId;
    this.amount = props.amount;
    this.available_amount = props.availableAmount;
    this.owner_name = props.thirdPartName;
    this.owner_person_type = props.thirdPartPersonType;
    this.owner_document =
      props.thirdPartPersonType === PersonDocumentType.CPF
        ? cpfMask(props.thirdPartDocument)
        : props.thirdPartDocument;
    this.owner_account_number = props.thirdPartAccountNumber;
    this.owner_branch = props.thirdPartBranch;
    this.owner_bank_name = props.thirdPartBank?.name;
    this.owner_bank_ispb = props.thirdPartBank?.ispb;
    this.beneficiary_name = props.clientName;
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

class V2GetAllPixDepositRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'PixDeposits data.',
    type: [V2GetAllPixDepositRestResponseItem],
  })
  data!: V2GetAllPixDepositRestResponseItem[];

  constructor(props: GetAllPixDepositByWalletResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new V2GetAllPixDepositRestResponseItem(item),
    );
  }
}

/**
 * PixDeposits controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Deposits')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/deposits')
@HasPermission('api-paas-get-pix-deposits')
export class V2GetAllPixDepositRestController {
  /**
   * get deposit endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: "List user's deposits.",
    description: "Get a list of user's deposits.",
  })
  @ApiOkResponse({
    description: 'The deposits returned successfully.',
    type: V2GetAllPixDepositRestResponse,
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
    @Query() query: V2GetAllPixDepositParams,
    @KafkaServiceParam(GetAllPixDepositByWalletServiceKafka)
    getAllPixDepositService: GetAllPixDepositByWalletServiceKafka,
    @LoggerParam(V2GetAllPixDepositRestController)
    logger: Logger,
  ): Promise<V2GetAllPixDepositRestResponse> {
    // GetAll payload.
    const payload: GetAllPixDepositByWalletRequest = {
      // PixDeposit query
      userId: user.uuid,
      walletId: wallet.id,
      createdAtPeriodStart: query.created_at_period_start,
      createdAtPeriodEnd: query.created_at_period_end,
      endToEndId: query.end_to_end_id,
      clientDocument: query.client_document,
      states: query.states,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll deposits.', { user, payload });

    // Call get all payment service.
    const result = await getAllPixDepositService.execute(payload);

    logger.debug('Pix Deposits found.', { result });

    const response = new V2GetAllPixDepositRestResponse(result);

    return response;
  }
}