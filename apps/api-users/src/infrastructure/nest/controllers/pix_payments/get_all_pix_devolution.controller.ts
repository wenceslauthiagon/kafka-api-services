import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
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
  DefaultApiHeaders,
  cpfMask,
  cnpjMask,
  HasPermission,
} from '@zro/common';
import { AuthWallet } from '@zro/operations/domain';
import { PixDevolutionState } from '@zro/pix-payments/domain';
import { AuthUser, PersonDocumentType } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetAllPixDevolutionByWalletResponseItem,
  GetAllPixDevolutionByWalletResponse,
  GetAllPixDevolutionByWalletRequest,
  GetAllPixDevolutionByWalletRequestSort,
} from '@zro/pix-payments/interface';
import { GetAllPixDevolutionByWalletServiceKafka } from '@zro/pix-payments/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';

export enum WebhookType {
  DEVOLUTION_COMPLETED = 'DEVOLUTION_COMPLETED',
  DEVOLUTION_RECEIVED = 'DEVOLUTION_RECEIVED',
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
}

class GetAllPixDevolutionByWalletParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPixDevolutionByWalletRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPixDevolutionByWalletRequestSort)
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
    description: 'PixDevolution end to end id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end_id?: string;

  @ApiPropertyOptional({
    enum: PixDevolutionState,
    description: 'PixDevolution State.',
    example: [PixDevolutionState.ERROR, PixDevolutionState.CONFIRMED],
    isArray: true,
  })
  @Transform((params) => {
    if (!params.value) return null;
    return Array.isArray(params.value) ? params.value : [params.value];
  })
  @IsOptional()
  @IsEnum(PixDevolutionState, { each: true })
  states?: PixDevolutionState[];
}

class GetAllPixDevolutionByWalletRestResponseItem {
  @ApiProperty({
    description: 'Devolution ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'User defined devolution description.',
    example: 'The party devolution.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Error returned when devolution is reverted.',
    example:
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    required: false,
    nullable: true,
  })
  failed_message?: string;

  @ApiProperty({
    description:
      'Operation UUID. Used to get receipt and track the transaction.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  @ApiProperty({
    description: 'Transaction type.',
    enum: WebhookType,
  })
  type!: WebhookType;

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

  @ApiProperty({
    enum: PixDevolutionState,
    description: 'Devolution state.',
    example: PixDevolutionState.CONFIRMED,
  })
  state: PixDevolutionState;

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
    description: 'Devolution created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetAllPixDevolutionByWalletResponseItem) {
    this.id = props.id;
    this.state = props.state;
    this.description = props.description;
    this.operation_id = props.operationId;
    this.failed_message = props.failed?.message;
    this.type = WebhookType.DEVOLUTION_COMPLETED;
    this.end_to_end_id = props.endToEndId;
    this.txid = props.depositTxId;
    this.amount = props.amount;
    this.owner_name = props.depositClientName;
    this.owner_person_type = props.depositClientPersonType;
    this.owner_document =
      props.depositClientPersonType === PersonDocumentType.CPF
        ? cpfMask(props.depositClientDocument)
        : cnpjMask(props.depositClientDocument);
    this.owner_bank_name = props.depositClientBankName;
    this.beneficiary_name = props.depositThirdPartName;
    this.beneficiary_person_type = props.depositThirdPartPersonType;
    this.beneficiary_document =
      props.depositThirdPartPersonType === PersonDocumentType.CPF
        ? cpfMask(props.depositThirdPartDocument)
        : cnpjMask(props.depositThirdPartDocument);
    this.beneficiary_bank_name = props.depositThirdPartBankName;
    this.created_at = props.createdAt;
  }
}

class GetAllPixDevolutionByWalletRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'PixDevolutions data.',
    type: [GetAllPixDevolutionByWalletRestResponseItem],
  })
  data!: GetAllPixDevolutionByWalletRestResponseItem[];

  constructor(props: GetAllPixDevolutionByWalletResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllPixDevolutionByWalletRestResponseItem(item),
    );
  }
}

/**
 * PixDevolutions controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/devolutions')
@HasPermission('api-users-get-pix-devolutions')
export class GetAllPixDevolutionRestController {
  /**
   * get devolution endpoint.
   */
  @ApiOperation({
    summary: "List user's pix devolutions.",
    description:
      "Get a list of the user's pix devolutions. You can include any of the filter parameters below to refine your search.",
  })
  @ApiOkResponse({
    description: 'The devolutions returned successfully.',
    type: GetAllPixDevolutionByWalletRestResponse,
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
    @Query() query: GetAllPixDevolutionByWalletParams,
    @KafkaServiceParam(GetAllPixDevolutionByWalletServiceKafka)
    getAllPixDevolutionService: GetAllPixDevolutionByWalletServiceKafka,
    @LoggerParam(GetAllPixDevolutionRestController)
    logger: Logger,
  ): Promise<GetAllPixDevolutionByWalletRestResponse> {
    // GetAll payload.
    const payload: GetAllPixDevolutionByWalletRequest = {
      // PixDevolution query
      userId: user.uuid,
      walletId: wallet.id,
      createdAtPeriodStart: query.created_at_period_start,
      createdAtPeriodEnd: query.created_at_period_end,
      endToEndId: query.end_to_end_id,
      states: query.states,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('GetAll devolutions.', { user, payload });

    // Call get all payment service.
    const result = await getAllPixDevolutionService.execute(payload);

    logger.debug('Pix Devolutions found.', { result });

    const response = new GetAllPixDevolutionByWalletRestResponse(result);

    return response;
  }
}
