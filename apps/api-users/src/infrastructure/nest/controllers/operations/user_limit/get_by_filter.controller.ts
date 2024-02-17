import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsInt, IsOptional, IsUUID } from 'class-validator';
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
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetUserLimitsByFilterServiceKafka } from '@zro/operations/infrastructure';
import {
  GetUserLimitByFilterItem,
  GetUserLimitsByFilterRequest,
} from '@zro/operations/interface';

export class GetUserLimitsByFilterRestParamsRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty({
    description: 'Limit type id.',
    example: 1,
  })
  @IsInt()
  @Transform((params) => parseInt(params.value))
  limit_type_id?: number;
}

export type GetUserLimitsByFilterRestResponseItem = GetUserLimitByFilterItem;

export class GetUserLimitsByFilterRestResponse {
  @ApiProperty({
    description: 'User limit id.',
    example: '3267dfe0-73ee-4421-80e7-0c3a5372fa13',
  })
  @IsUUID(4)
  id: string;

  @ApiProperty({
    description: 'Limit Type id.',
    example: 1,
  })
  @IsInt()
  limit_type_id: number;

  @ApiProperty({
    description: 'Limit type tag.',
    example: 'PIXSEND',
  })
  limit_type_tag: string;

  @ApiProperty({
    description: 'Limit type description.',
    example: 'Limite para envio ou pagamento via PIX',
  })
  limit_type_description: string;

  @ApiProperty({
    description: 'Daily limit',
    example: 1000,
  })
  @IsInt()
  daily_limit: number;

  @ApiProperty({
    description: 'User daily limit',
    example: 1000,
  })
  @IsInt()
  user_daily_limit: number;

  @ApiProperty({
    description: 'Monthly limit',
    example: 1000,
  })
  @IsInt()
  monthly_limit: number;

  @ApiProperty({
    description: 'User monthly limit',
    example: 1000,
  })
  @IsInt()
  user_monthly_limit: number;

  @ApiProperty({
    description: 'Yearly limit',
    example: 1000,
  })
  @IsInt()
  yearly_limit: number;

  @ApiProperty({
    description: 'User yearly limit',
    example: 1000,
  })
  @IsInt()
  user_yearly_limit: number;

  @ApiProperty({
    description: 'Nightly limit',
    example: 1000,
  })
  @IsInt()
  nightly_limit: number;

  @ApiProperty({
    description: 'User nightly limit',
    example: 1000,
  })
  @IsInt()
  user_nightly_limit: number;

  @ApiProperty({
    description: 'Max amount',
    example: 1000,
  })
  @IsInt()
  max_amount: number;

  @ApiProperty({
    description: 'Min amount',
    example: 1000,
  })
  @IsInt()
  min_amount: number;

  @ApiProperty({
    description: 'Max amount nightly',
    example: 1000,
  })
  @IsInt()
  max_amount_nightly: number;

  @ApiProperty({
    description: 'Min amount nightly',
    example: 1000,
  })
  @IsInt()
  min_amount_nightly: number;

  @ApiProperty({
    description: 'User Max amount',
    example: 1000,
  })
  @IsInt()
  user_max_amount: number;

  @ApiProperty({
    description: 'User Min amount',
    example: 1000,
  })
  @IsInt()
  user_min_amount: number;

  @ApiProperty({
    description: 'User Max amount nightly',
    example: 1000,
  })
  @IsInt()
  user_max_amount_nightly: number;

  @ApiProperty({
    description: 'User Min amount nightly',
    example: 1000,
  })
  @IsInt()
  user_min_amount_nightly: number;

  @ApiProperty({
    description: 'Night time start.',
    example: '20:00',
  })
  night_time_start: string;

  @ApiProperty({
    description: 'Night time end.',
    example: '06:00',
  })
  night_time_end: string;

  constructor(props: GetUserLimitsByFilterRestResponseItem) {
    this.id = props.id;
    this.limit_type_id = props.limitTypeId;
    this.limit_type_tag = props.limitTypeTag;
    this.limit_type_description = props.limitTypeDescription;
    this.daily_limit = props.dailyLimit;
    this.user_daily_limit = props.userDailyLimit;
    this.monthly_limit = props.monthlyLimit;
    this.user_monthly_limit = props.userMonthlyLimit;
    this.yearly_limit = props.yearlyLimit;
    this.user_yearly_limit = props.userYearlyLimit;
    this.nightly_limit = props.nightlyLimit;
    this.user_nightly_limit = props.userNightlyLimit;
    this.max_amount = props.maxAmount;
    this.min_amount = props.minAmount;
    this.max_amount_nightly = props.maxAmountNightly;
    this.min_amount_nightly = props.minAmountNightly;
    this.user_max_amount = props.userMaxAmount;
    this.user_min_amount = props.userMinAmount;
    this.user_max_amount_nightly = props.userMaxAmountNightly;
    this.user_min_amount_nightly = props.userMinAmountNightly;
    this.night_time_start = props.nighttimeStart;
    this.night_time_end = props.nighttimeEnd;
  }
}

/**
 * Get user limits by filter controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | User Limits')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('limits/users')
@HasPermission('api-users-get-limit-users')
export class GetUserLimitsByFilterRestController {
  /**
   * Get user limits by filter endpoint.
   */
  @ApiOperation({
    summary: 'Get user limits by filter.',
    description: 'Get user limits by filter.',
  })
  @ApiOkResponse({
    description: 'The user limits filtered.',
    type: [GetUserLimitsByFilterRestResponse],
  })
  @ApiUnauthorizedResponse({ description: 'User authentication failed.' })
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
    @LoggerParam(GetUserLimitsByFilterRestController) logger: Logger,
    @KafkaServiceParam(GetUserLimitsByFilterServiceKafka)
    getUserLimitsByFilterService: GetUserLimitsByFilterServiceKafka,
    @Query() params: GetUserLimitsByFilterRestParamsRequest,
  ): Promise<GetUserLimitsByFilterRestResponse[]> {
    // GetAll a payload.
    const payload: GetUserLimitsByFilterRequest = {
      userId: user.uuid,
      limitTypeId: params.limit_type_id,
    };

    logger.debug('Get user limits by filter.', { user, payload });

    // Call get user limits by filter service.
    const result = await getUserLimitsByFilterService.execute(payload);

    logger.debug('User limits found.', { result });

    const response = result.map(
      (item) => new GetUserLimitsByFilterRestResponse(item),
    );

    return response;
  }
}
