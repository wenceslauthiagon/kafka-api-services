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
import { PixDevolutionReceivedState } from '@zro/pix-payments/domain';
import { PersonDocumentType, AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  GetAllPixDevolutionReceivedByWalletResponseItem,
  GetAllPixDevolutionReceivedByWalletResponse,
  GetAllPixDevolutionReceivedByWalletRequest,
  GetAllPixDevolutionReceivedByWalletRequestSort,
} from '@zro/pix-payments/interface';
import { GetAllPixDevolutionReceivedByWalletServiceKafka } from '@zro/pix-payments/infrastructure';
import { V3WebhookType } from '@zro/api-paas/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

class V3GetAllPixDevolutionReceivedParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllPixDevolutionReceivedByWalletRequestSort,
  })
  @IsOptional()
  @Sort(GetAllPixDevolutionReceivedByWalletRequestSort)
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
    description: 'PixDevolutionReceived end to end id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end_id?: string;

  @ApiPropertyOptional({
    enum: PixDevolutionReceivedState,
    description: 'PixDevolutionReceived State.',
    example: [
      PixDevolutionReceivedState.ERROR,
      PixDevolutionReceivedState.READY,
    ],
    isArray: true,
  })
  @Transform((params) => {
    if (!params.value) return null;
    return Array.isArray(params.value) ? params.value : [params.value];
  })
  @IsOptional()
  @IsEnum(PixDevolutionReceivedState, { each: true })
  states?: PixDevolutionReceivedState[];
}

class V3GetAllPixDevolutionReceivedRestResponseItem {
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

  @ApiProperty({
    description: 'Transaction type.',
    enum: V3WebhookType,
  })
  type!: V3WebhookType;

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

  constructor(props: GetAllPixDevolutionReceivedByWalletResponseItem) {
    this.id = props.id;
    this.state = props.state;
    this.description = props.description;
    this.operation_id = props.operationId;
    this.type = V3WebhookType.DEVOLUTION_RECEIVED;
    this.end_to_end_id = props.endToEndId;
    this.txid = props.txId;
    this.amount = props.amount;
    this.owner_name = props.thirdPartName;
    this.owner_person_type = props.thirdPartPersonType;
    this.owner_document = props.thirdPartDocument;
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

class V3GetAllPixDevolutionReceivedRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'PixDevolutionReceiveds data.',
    type: [V3GetAllPixDevolutionReceivedRestResponseItem],
  })
  data!: V3GetAllPixDevolutionReceivedRestResponseItem[];

  constructor(props: GetAllPixDevolutionReceivedByWalletResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new V3GetAllPixDevolutionReceivedRestResponseItem(item),
    );
  }
}

/**
 * PixDevolutionReceiveds controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Devolutions')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('pix/devolutions-received')
@HasPermission('api-paas-get-pix-devolutions-received')
export class V3GetAllPixDevolutionReceivedRestController {
  /**
   * get devolution received endpoint.
   */
  @ApiOperation({
    summary: "List user's received pix devolutions.",
    description:
      "Get a list of user's received pix devolutions. You can include any of the filter parameters below to refine your search.",
  })
  @ApiOkResponse({
    description: 'The devolutions received returned successfully.',
    type: V3GetAllPixDevolutionReceivedRestResponse,
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
  @Version('3')
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Query() query: V3GetAllPixDevolutionReceivedParams,
    @KafkaServiceParam(GetAllPixDevolutionReceivedByWalletServiceKafka)
    getAllPixDevolutionReceivedService: GetAllPixDevolutionReceivedByWalletServiceKafka,
    @LoggerParam(V3GetAllPixDevolutionReceivedRestController)
    logger: Logger,
  ): Promise<V3GetAllPixDevolutionReceivedRestResponse> {
    // GetAll payload.
    const payload: GetAllPixDevolutionReceivedByWalletRequest = {
      // PixDevolutionReceived query
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

    logger.debug('GetAll devolutions received.', { user, payload });

    // Call get all devolution received service.
    const result = await getAllPixDevolutionReceivedService.execute(payload);

    logger.debug('Pix Devolutions received found.', { result });

    const response = new V3GetAllPixDevolutionReceivedRestResponse(result);

    return response;
  }
}
