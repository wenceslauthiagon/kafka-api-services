import { Logger } from 'winston';
import { Controller, Body, Post } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
  getMoment,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { HolidayLevel, HolidayType } from '@zro/quotations/domain';
import {
  CreateHolidayRequest,
  CreateHolidayResponse,
} from '@zro/quotations/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { CreateHolidayServiceKafka } from '@zro/quotations/infrastructure';

class CreateHolidayBody {
  @ApiProperty({
    description: 'Holiday start date.',
    example: getMoment().format('YYYY-MM-DDTHH:mm:ss'),
  })
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format date start_date',
  })
  @IsDateBeforeThan('end_date', false, {
    message: 'start_date must be before than end_date',
  })
  start_date: Date;

  @ApiProperty({
    description: 'Holiday end date.',
    example: getMoment().add(1, 'day').format('YYYY-MM-DDTHH:mm:ss'),
  })
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format date end_date',
  })
  @IsDateAfterThan('start_date', false, {
    message: 'end_date must be after than start_date',
  })
  end_date: Date;

  @ApiProperty({
    description: 'Holiday name.',
    example: 'Feriado Nacional',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Holiday Level',
    example: HolidayLevel.NATIONAL,
    enum: HolidayLevel,
  })
  @IsEnum(HolidayLevel)
  level: HolidayLevel;

  @ApiProperty({
    description: 'Holiday Type',
    example: HolidayType.HOLIDAY,
    enum: HolidayType,
  })
  @IsEnum(HolidayType)
  type: HolidayType;
}

class CreateHolidayRestResponse {
  @ApiProperty({
    description: 'Holiday ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Holiday created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: CreateHolidayResponse) {
    this.id = props.id;
    this.created_at = props.createdAt;
  }
}

/**
 * Holiday controller. Controller is protected by JWT access token.
 */
@ApiTags('Quotations | Holiday')
@ApiBearerAuth()
@Controller('quotations/holiday')
export class CreateHolidayRestController {
  /**
   * Create holiday endpoint.
   */
  @ApiOperation({
    summary: 'Add new holiday.',
    description: 'Add new holiday. Return the created holiday.',
  })
  @ApiCreatedResponse({
    description: 'The holiday returned successfully.',
    type: CreateHolidayRestResponse,
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
  @Post()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @Body() body: CreateHolidayBody,
    @KafkaServiceParam(CreateHolidayServiceKafka)
    service: CreateHolidayServiceKafka,
    @LoggerParam(CreateHolidayRestController)
    logger: Logger,
  ): Promise<CreateHolidayRestResponse> {
    // Create a payload.
    const payload: CreateHolidayRequest = {
      id: uuidV4(),
      startDate: body.start_date,
      endDate: body.end_date,
      name: body.name,
      level: body.level,
      type: body.type,
    };

    logger.debug('Create holiday.', { admin, payload });

    // Call create holiday service.
    const result = await service.execute(payload);

    logger.debug('Holiday created.', { result });

    return new CreateHolidayRestResponse(result);
  }
}
