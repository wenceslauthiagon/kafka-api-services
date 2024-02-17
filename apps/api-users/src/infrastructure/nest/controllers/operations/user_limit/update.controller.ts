import { Logger } from 'winston';
import { Body, Controller, Patch } from '@nestjs/common';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
} from 'class-validator';
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
import { UpdateUserLimitServiceKafka } from '@zro/operations/infrastructure';
import {
  UpdateUserLimitItem,
  UpdateUserLimitRequest,
  UpdateUserLimitResponse,
} from '@zro/operations/interface';

export class UpdateUserLimitRestBodyRequest {
  @ApiProperty({
    description: 'Limit types ids.',
    example: [1],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  limit_types_ids: number[];

  @ApiPropertyOptional({
    description: 'User max amount limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  user_max_amount?: number;

  @ApiPropertyOptional({
    description: 'User min amount limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  user_min_amount?: number;

  @ApiPropertyOptional({
    description: 'User max amount nightly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  user_max_amount_nightly?: number;

  @ApiPropertyOptional({
    description: 'User min amount nightly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  user_min_amount_nightly?: number;

  @ApiPropertyOptional({
    description: 'User daily limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  user_daily_limit?: number;

  @ApiPropertyOptional({
    description: 'User monthly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  user_monthly_limit?: number;

  @ApiPropertyOptional({
    description: 'User yearly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  user_yearly_limit?: number;

  @ApiPropertyOptional({
    description: 'User nightly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  user_nightly_limit?: number;

  @ApiPropertyOptional({
    description: 'Night time start.',
    example: '22:00',
    maxLength: 5,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  night_time_start?: string;

  @ApiPropertyOptional({
    description: 'Night time end.',
    example: '06:00',
    maxLength: 5,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  night_time_end?: string;
}
class UpdateUserLimitRestResponseItem {
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

  constructor(props: UpdateUserLimitItem) {
    this.id = props.id;
    this.limit_type_id = props.limitTypeId;
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

class UpdateUserLimitRestResponse {
  @ApiProperty({
    description: 'User limits data.',
    type: [UpdateUserLimitRestResponseItem],
  })
  data!: UpdateUserLimitRestResponseItem[];

  constructor(props: UpdateUserLimitResponse) {
    this.data = props.map((item) => new UpdateUserLimitRestResponseItem(item));
  }
}

/**
 * Update user limit controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | User Limits')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('limits/users')
@HasPermission('api-users-patch-limit-users')
export class UpdateUserLimitRestController {
  /**
   * update user limit endpoint.
   */
  @ApiOperation({
    summary: 'Update user limit.',
    description: 'Update user limit.',
  })
  @ApiOkResponse({
    description: 'The user limit updated.',
    type: UpdateUserLimitRestResponse,
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
  @Patch()
  async execute(
    @AuthUserParam() user: AuthUser,
    @LoggerParam(UpdateUserLimitRestController)
    logger: Logger,
    @KafkaServiceParam(UpdateUserLimitServiceKafka)
    updateUserLimitService: UpdateUserLimitServiceKafka,
    @Body() body: UpdateUserLimitRestBodyRequest,
  ): Promise<UpdateUserLimitRestResponse> {
    // GetAll a payload.
    const payload: UpdateUserLimitRequest = {
      userId: user.uuid,
      limitTypesIds: body.limit_types_ids,
      userMaxAmount: body.user_max_amount,
      userMinAmount: body.user_min_amount,
      userMaxAmountNightly: body.user_max_amount_nightly,
      userMinAmountNightly: body.user_min_amount_nightly,
      userDailyLimit: body.user_daily_limit,
      userMonthlyLimit: body.user_monthly_limit,
      userYearlyLimit: body.user_yearly_limit,
      userNightlyLimit: body.user_nightly_limit,
      nighttimeStart: body.night_time_start,
      nighttimeEnd: body.night_time_end,
    };

    logger.debug('Update user limit.', { user, payload });

    // Call update user limit service.
    const result = await updateUserLimitService.execute(payload);

    logger.debug('User limit updated.', { result });

    const response = result && new UpdateUserLimitRestResponse(result);

    return response;
  }
}
