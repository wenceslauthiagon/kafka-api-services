import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import {
  IsDateAfterThan,
  IsDateBeforeThan,
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  getMoment,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { HolidayLevel, HolidayType } from '@zro/quotations/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { UpdateHolidayByIdServiceKafka } from '@zro/quotations/infrastructure';
import {
  UpdateHolidayByIdRequest,
  UpdateHolidayByIdResponse,
} from '@zro/quotations/interface';

class UpdateHolidayByIdParams {
  @ApiProperty({
    description: 'Holiday ID.',
  })
  @IsUUID(4)
  id!: string;
}

class UpdateHolidayByIdBody {
  @ApiProperty({
    description: 'Holiday start date.',
    example: getMoment().format('YYYY-MM-DDTHH:mm:ss'),
  })
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss')
  @IsDateBeforeThan('endDate', true, {
    message: 'Start date must be before end date.',
  })
  start_date: Date;

  @ApiProperty({
    description: 'Holiday end date.',
    example: getMoment().format('YYYY-MM-DDTHH:mm:ss'),
  })
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss')
  @IsDateAfterThan('startDate', true, {
    message: 'End date must be after start date.',
  })
  end_date: Date;
}

export class UpdateHolidayByIdRestResponse {
  @ApiProperty({
    description: 'Holiday ID.',
    example: '468e2142-1e83-4888-b109-859561f9ddd3',
  })
  id!: string;

  @ApiProperty({
    description: 'Holiday start date.',
    example: new Date(),
  })
  start_date!: Date;

  @ApiProperty({
    description: 'Holiday end date.',
    example: new Date(),
  })
  end_date!: Date;

  @ApiProperty({
    description: 'Holiday name.',
    example: 'Christmas',
  })
  name!: string;

  @ApiProperty({
    description: 'Holiday type.',
    example: HolidayType.HOLIDAY,
    enum: HolidayType,
  })
  type!: HolidayType;

  @ApiProperty({
    description: 'Holiday level.',
    example: HolidayLevel.NATIONAL,
    enum: HolidayLevel,
  })
  level!: HolidayLevel;

  @ApiProperty({
    description: 'Holiday created at.',
    example: new Date(),
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Holiday updated at.',
    example: new Date(),
  })
  updated_at!: Date;

  constructor(props: UpdateHolidayByIdResponse) {
    this.id = props.id;
    this.start_date = props.startDate;
    this.end_date = props.endDate;
    this.name = props.name;
    this.type = props.type;
    this.level = props.level;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

/**
 * Update holiday controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Quotations | Holidays')
@ApiBearerAuth()
@Controller('quotations/holiday/:id')
export class UpdateHolidayByIdRestController {
  /**
   * Update holiday endpoint.
   */
  @ApiOperation({
    description: 'Update holiday.',
  })
  @ApiOkResponse({
    description: 'Holiday has been successfully updated.',
    type: UpdateHolidayByIdRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Admin authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Patch()
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(UpdateHolidayByIdServiceKafka)
    updateHolidayByIdService: UpdateHolidayByIdServiceKafka,
    @LoggerParam(UpdateHolidayByIdRestController)
    logger: Logger,
    @Body() body: UpdateHolidayByIdBody,
    @Param() params: UpdateHolidayByIdParams,
  ): Promise<UpdateHolidayByIdRestResponse> {
    // Create a payload.
    const payload: UpdateHolidayByIdRequest = {
      id: params.id,
      startDate: body.start_date,
      endDate: body.end_date,
    };

    logger.debug('Updating holiday.', { admin, payload });

    // Call update holiday service.
    const result = await updateHolidayByIdService.execute(payload);

    logger.debug('Updated holiday.', { result });

    const response = new UpdateHolidayByIdRestResponse(result);

    return response;
  }
}
