import { Body, Controller, Logger, Post } from '@nestjs/common';
import { IsOptional, IsUUID, IsInt, IsEnum } from 'class-validator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import {
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { CreateUserLimitRequestServiceKafka } from '@zro/compliance/infrastructure';
import {
  CreateUserLimitRequest,
  CreateUserLimitRequestResponse,
} from '@zro/compliance/interface';

class CreateUserLimitRequestBody {
  @ApiProperty({
    description: 'User limit id.',
    example: '3267dfe0-73ee-4421-80e7-0c3a5372fa13',
  })
  @IsUUID(4)
  user_limit_id!: string;

  @ApiProperty({
    description: 'Request Yearly limit',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  request_yearly_limit: number;

  @ApiProperty({
    description: 'Request Monthly limit',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  request_monthly_limit: number;

  @ApiProperty({
    description: 'Request Daily limit',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  request_daily_limit: number;

  @ApiProperty({
    description: 'Request Nightly limit',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  request_nightly_limit: number;

  @ApiProperty({
    description: 'Request max amount',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  request_max_amount: number;

  @ApiProperty({
    description: 'Request min amount',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  request_min_amount: number;

  @ApiProperty({
    description: 'Request max amount nightly',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  request_max_amount_nightly: number;

  @ApiProperty({
    description: 'Request min amount nightly',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  request_min_amount_nightly: number;
}

class CreateUserLimitRequestRestResponse {
  @ApiProperty({
    description: 'Signup ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: true,
  })
  @IsUUID(4)
  id: string;

  @ApiProperty({
    enum: UserLimitRequestStatus,
    description: 'User limit request status',
    example: UserLimitRequestStatus.OPEN,
  })
  @IsEnum(UserLimitRequestStatus)
  status: UserLimitRequestStatus;

  @ApiProperty({
    enum: UserLimitRequestState,
    description: 'User limit request state',
    example: UserLimitRequestState.OPEN_PENDING,
  })
  @IsEnum(UserLimitRequestState)
  state: UserLimitRequestState;

  @ApiProperty({
    description: 'User id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: true,
  })
  @IsUUID(4)
  user_id: string;

  @ApiProperty({
    description: 'User limit ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: true,
  })
  @IsUUID(4)
  user_limit_id: string;

  @ApiProperty({
    description: 'Limit type description.',
    example: 'Limite para saque via PIX',
  })
  limit_type_description: string;

  @ApiProperty({
    description: 'Request Yearly limit',
    example: 1000,
    required: true,
  })
  @IsInt()
  request_yearly_limit: number;

  @ApiProperty({
    description: 'Request Monthly limit',
    example: 1000,
    required: true,
  })
  @IsInt()
  request_monthly_limit: number;

  @ApiProperty({
    description: 'Request Daily limit',
    example: 1000,
    required: true,
  })
  @IsInt()
  request_daily_limit: number;

  @ApiProperty({
    description: 'Request Nightly limit',
    example: 1000,
    required: true,
  })
  @IsInt()
  request_nightly_limit: number;

  @ApiProperty({
    description: 'Request max amount',
    example: 1000,
    required: true,
  })
  @IsInt()
  request_max_amount: number;

  @ApiProperty({
    description: 'Request min amount',
    example: 1000,
    required: true,
  })
  @IsInt()
  request_min_amount: number;

  @ApiProperty({
    description: 'Request max amount nightly',
    example: 1000,
    required: true,
  })
  @IsInt()
  request_max_amount_nightly: number;

  @ApiProperty({
    description: 'Request min amount nightly',
    example: 1000,
    required: true,
  })
  @IsInt()
  request_min_amount_nightly: number;

  constructor(props: CreateUserLimitRequestResponse) {
    this.id = props.id;
    this.status = props.status;
    this.state = props.state;
    this.user_id = props.userId;
    this.user_limit_id = props.userLimitId;
    this.limit_type_description = props.limitTypeDescription;
    this.request_yearly_limit = props.requestYearlyLimit;
    this.request_monthly_limit = props.requestMonthlyLimit;
    this.request_daily_limit = props.requestDailyLimit;
    this.request_max_amount = props.requestMaxAmount;
    this.request_min_amount = props.requestMinAmount;
    this.request_max_amount_nightly = props.requestMaxAmountNightly;
    this.request_min_amount_nightly = props.requestMinAmountNightly;
  }
}

/**
 * Signup create controller.
 */
@ApiTags('Compliance | Limit Request')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('limit-request')
@HasPermission('api-users-post-limit-request')
export class CreateUserLimitRequestRestController {
  /**
   * Create user limit request endpoint.
   */
  @ApiOperation({
    summary: 'User limit request.',
    description: 'Create user limit request.',
  })
  @ApiCreatedResponse({
    description: 'User limit request created successfully.',
    type: CreateUserLimitRequestRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(CreateUserLimitRequestServiceKafka)
    createUserLimitRequestService: CreateUserLimitRequestServiceKafka,
    @LoggerParam(CreateUserLimitRequestRestController)
    logger: Logger,
    @Body() body: CreateUserLimitRequestBody,
  ): Promise<CreateUserLimitRequestRestResponse> {
    // Create a payload.
    const payload: CreateUserLimitRequest = {
      userId: user.uuid,
      userLimitId: body.user_limit_id,
      requestYearlyLimit: body.request_yearly_limit,
      requestMonthlyLimit: body.request_monthly_limit,
      requestDailyLimit: body.request_daily_limit,
      requestNightlyLimit: body.request_nightly_limit,
      requestMaxAmount: body.request_max_amount,
      requestMinAmount: body.request_min_amount,
      requestMaxAmountNightly: body.request_max_amount_nightly,
      requestMinAmountNightly: body.request_min_amount_nightly,
    };

    logger.debug('Create new user limit request.', { payload });

    // Call create user limit request service.
    const result = await createUserLimitRequestService.execute(payload);

    logger.debug('User limit request created.', result);

    const response = new CreateUserLimitRequestRestResponse(result);

    return response;
  }
}
