import { Logger } from 'winston';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';
import {
  IsIsoStringDateFormat,
  KafkaServiceParam,
  LoggerParam,
  getMoment,
} from '@zro/common';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { AuthAdmin } from '@zro/api-admin/domain';
import { HandleReprocessPixStatementEventRequest } from '@zro/api-topazio/interface';
import { ReprocessPixStatementServiceKafka } from '@zro/api-topazio/infrastructure';

export class ReprocessPixStatementBody {
  @ApiProperty({
    description:
      'Date from start process. If you want reprocess from 2 days ago to today, this field will receive date from 2 days ago.',
    example: getMoment().subtract(1, 'd').format('YYYY-MM-DD'),
    required: true,
  })
  @IsIsoStringDateFormat('YYYY-MM-DD')
  date_from: string;

  @ApiProperty({
    description:
      'Page from start process. The number of page that you want to start.',
    example: 1,
    required: true,
  })
  @IsInt()
  @Min(1)
  page_from: number;

  @ApiPropertyOptional({
    description:
      'The end to end ids that you want to process. Only this end to end id will be processed.',
    isArray: true,
    example: ['E07679404202303211141kqGSODLG1Tr'],
  })
  @IsArray()
  @IsOptional()
  end_to_end_ids: string[];
}

/**
 * Reprocess pix statement controller. Controller is protected by admin JWT access token.
 */
@ApiTags('Topazio')
@ApiBearerAuth()
@Controller('pix-statements/reprocess')
export class ReprocessPixStatementRestController {
  /**
   * Reprocess pix statement endpoint.
   */
  @ApiOperation({
    description:
      'This endpoint reprocesses existing statements. There is a cron that runs automatically, this endpoint is for a contingency',
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
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(ReprocessPixStatementServiceKafka)
    service: ReprocessPixStatementServiceKafka,
    @LoggerParam(ReprocessPixStatementRestController)
    logger: Logger,
    @Body() body: ReprocessPixStatementBody,
  ): Promise<void> {
    // Create a payload.
    const payload: HandleReprocessPixStatementEventRequest = {
      dateFrom: body.date_from,
      pageFrom: body.page_from,
      endToEndIds: body.end_to_end_ids,
    };

    logger.debug('Reprocess pix statement.', { admin, payload });

    // Call reprocess pix statement.
    await service.execute(payload);

    logger.debug('Reprocess pix statement started successfully.');
  }
}
