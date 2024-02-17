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
import { PixDevolutionReceivedState } from '@zro/pix-payments/domain';
import {
  GetAllPixDevolutionReceivedByWalletResponseItem,
  GetAllPixDevolutionReceivedByWalletResponse,
  GetAllPixDevolutionReceivedByWalletRequest,
  GetAllPixDevolutionReceivedByWalletRequestSort,
} from '@zro/pix-payments/interface';
import { GetAllPixDevolutionReceivedByWalletServiceKafka } from '@zro/pix-payments/infrastructure';
import { AuthWallet } from '@zro/operations/domain';
import {
  WalletApiHeader,
  AuthWalletParam,
} from '@zro/operations/infrastructure';

export class GetAllPixDevolutionReceivedParams extends PaginationParams {
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
    description: 'PixDevolutionReceived client document',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_document?: string;

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

class GetAllPixDevolutionReceivedRestResponseItem {
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
    description: 'Devolution received created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description:
      'Operation UUID. Used to get receipt and track the transaction.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  operation_id: string;

  constructor(props: GetAllPixDevolutionReceivedByWalletResponseItem) {
    this.id = props.id;
    this.end_to_end_id = props.endToEndId;
    this.amount = props.amount;
    this.description = props.description;
    this.state = props.state;
    this.created_at = props.createdAt;
    this.operation_id = props.operationId;
  }
}

export class GetAllPixDevolutionReceivedRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'PixDevolutionReceiveds data.',
    type: [GetAllPixDevolutionReceivedRestResponseItem],
  })
  data!: GetAllPixDevolutionReceivedRestResponseItem[];

  constructor(props: GetAllPixDevolutionReceivedByWalletResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllPixDevolutionReceivedRestResponseItem(item),
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
@Controller('pix/devolution-received')
@HasPermission('api-paas-get-pix-devolutions-received')
export class GetAllPixDevolutionReceivedRestController {
  /**
   * get devolution received endpoint.
   */
  @ApiOperation({
    deprecated: true,
    summary: "List user's devolutions received.",
    description: "Get a list of user's devolutions received.",
  })
  @ApiOkResponse({
    description: 'The devolutions received returned successfully.',
    type: GetAllPixDevolutionReceivedRestResponse,
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
    @Query() query: GetAllPixDevolutionReceivedParams,
    @KafkaServiceParam(GetAllPixDevolutionReceivedByWalletServiceKafka)
    getAllPixDevolutionReceivedService: GetAllPixDevolutionReceivedByWalletServiceKafka,
    @LoggerParam(GetAllPixDevolutionReceivedRestController)
    logger: Logger,
  ): Promise<GetAllPixDevolutionReceivedRestResponse> {
    // GetAll payload.
    const payload: GetAllPixDevolutionReceivedByWalletRequest = {
      // PixDevolutionReceived query
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

    logger.debug('GetAll devolutions received.', { user, payload });

    // Call get all devolution received service.
    const result = await getAllPixDevolutionReceivedService.execute(payload);

    logger.debug('Pix Devolutions received found.', { result });

    const response = new GetAllPixDevolutionReceivedRestResponse(result);

    return response;
  }
}
