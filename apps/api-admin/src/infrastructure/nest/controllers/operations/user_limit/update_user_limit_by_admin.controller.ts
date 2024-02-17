import { Logger } from 'winston';
import { Body, Controller, Param, Patch } from '@nestjs/common';
import { IsOptional, IsUUID, IsInt } from 'class-validator';
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
import { UpdateUserLimitByAdminServiceKafka } from '@zro/operations/infrastructure';
import {
  UpdateUserLimitByAdminRequest,
  UpdateUserLimitByAdminResponse,
} from '@zro/operations/interface';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';

export class UpdateUserLimitByAdminPropsParams {
  @ApiProperty({
    description: 'User limit id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class UpdateUserLimitByAdminRestBodyRequest {
  @ApiPropertyOptional({
    description: 'Yearly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  yearly_limit?: number;

  @ApiPropertyOptional({
    description: 'Monthly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  monthly_limit?: number;

  @ApiPropertyOptional({
    description: 'Daily limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  daily_limit?: number;

  @ApiPropertyOptional({
    description: 'Nightly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  nightly_limit?: number;

  @ApiPropertyOptional({
    description: 'Max amount limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  max_amount?: number;

  @ApiPropertyOptional({
    description: 'Min amount limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  min_amount?: number;

  @ApiPropertyOptional({
    description: 'Max amount nightly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  max_amount_nightly?: number;

  @ApiPropertyOptional({
    description: 'Min amount nightly limit',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  min_amount_nightly?: number;
}

class UpdateUserLimitByAdminRestResponse {
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

  constructor(props: UpdateUserLimitByAdminResponse) {
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

/**
 * Update user limit by admin controller. Controller is protected by JWT access token.
 */
@ApiTags('Operations | User Limits')
@ApiBearerAuth()
@Controller('operations/user-limits/:id')
export class UpdateUserLimitByAdminRestController {
  /**
   * Update user limit by admin endpoint.
   */
  @ApiOperation({
    summary: 'Update user limit by admin.',
    description: 'Update user limit by admin.',
  })
  @ApiOkResponse({
    description: 'The user limit updated.',
    type: UpdateUserLimitByAdminRestResponse,
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
    @AuthAdminParam() admin: AuthAdmin,
    @LoggerParam(UpdateUserLimitByAdminRestController)
    logger: Logger,
    @KafkaServiceParam(UpdateUserLimitByAdminServiceKafka)
    updateUserLimitByAdminService: UpdateUserLimitByAdminServiceKafka,
    @Param() params: UpdateUserLimitByAdminPropsParams,
    @Body() body: UpdateUserLimitByAdminRestBodyRequest,
  ): Promise<UpdateUserLimitByAdminRestResponse> {
    // GetAll a payload.
    const payload: UpdateUserLimitByAdminRequest = {
      userLimitId: params.id,
      yearlyLimit: body.yearly_limit,
      monthlyLimit: body.monthly_limit,
      dailyLimit: body.daily_limit,
      nightlyLimit: body.nightly_limit,
      maxAmount: body.max_amount,
      minAmount: body.min_amount,
      maxAmountNightly: body.max_amount_nightly,
      minAmountNightly: body.min_amount_nightly,
    };

    logger.debug('Update user limit by admin.', { admin, payload });

    // Call update user limit by admin service.
    const result = await updateUserLimitByAdminService.execute(payload);

    logger.debug('User limit updated by admin.', { result });

    const response = result && new UpdateUserLimitByAdminRestResponse(result);

    return response;
  }
}
