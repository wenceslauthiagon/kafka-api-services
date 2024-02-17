import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
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
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  HasPermission,
  DefaultApiHeaders,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { PixDevolutionState } from '@zro/pix-payments/domain';
import {
  GetAllPixDevolutionByWalletResponseItem,
  GetAllPixDevolutionByWalletResponse,
  GetAllPixDevolutionByWalletRequest,
  GetAllPixDevolutionByWalletRequestSort,
} from '@zro/pix-payments/interface';
import { GetAllPixDevolutionByWalletServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

class GetAllPixDevolutionParams extends PaginationParams {
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
    description: 'PixDevolution client document',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_document?: string;

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

class GetAllPixDevolutionRestResponseItem {
  @ApiProperty({
    description: 'Devolution ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'End to End ID.',
  })
  end_to_end_id?: string;

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
    description: 'Error returned when devolution is reverted.',
    example:
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
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
    description:
      'Operation UUID. Used to get receipt and track the transaction.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  constructor(props: GetAllPixDevolutionByWalletResponseItem) {
    /**
     * If payment type is not "ACCOUNT",
     * we can't return the beneficiary's account number and agency to the payer
     */
    this.id = props.id;
    this.end_to_end_id = props.endToEndId;
    this.amount = props.amount;
    this.description = props.description;
    this.failed_message = props.failed?.message;
    this.state = props.state;
    this.created_at = props.createdAt;
    this.operation_id = props.operationId;
  }
}

class GetAllPixDevolutionRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'PixDevolutions data.',
    type: [GetAllPixDevolutionRestResponseItem],
  })
  data!: GetAllPixDevolutionRestResponseItem[];

  constructor(props: GetAllPixDevolutionByWalletResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllPixDevolutionRestResponseItem(item),
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
@Controller('pix/devolution')
@HasPermission('api-paas-get-pix-devolutions')
export class GetAllPixDevolutionRestController {
  /**
   * get devolution endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: "List user's devolutions.",
    description: "Get a list of user's devolutions.",
  })
  @ApiOkResponse({
    description: 'The devolutions returned successfully.',
    type: GetAllPixDevolutionRestResponse,
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
    @Query() query: GetAllPixDevolutionParams,
    @KafkaServiceParam(GetAllPixDevolutionByWalletServiceKafka)
    getAllPixDevolutionService: GetAllPixDevolutionByWalletServiceKafka,
    @LoggerParam(GetAllPixDevolutionRestController)
    logger: Logger,
  ): Promise<GetAllPixDevolutionRestResponse> {
    // GetAll payload.
    const payload: GetAllPixDevolutionByWalletRequest = {
      // PixDevolution query
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

    logger.debug('GetAll devolutions.', { user, payload });

    // Call get all payment service.
    const result = await getAllPixDevolutionService.execute(payload);

    logger.debug('Pix Devolutions found.', { result });

    const response = new GetAllPixDevolutionRestResponse(result);

    return response;
  }
}
