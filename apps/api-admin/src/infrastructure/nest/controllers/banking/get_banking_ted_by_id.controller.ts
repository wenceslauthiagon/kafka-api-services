import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
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
import { IsUUID } from 'class-validator';
import { KafkaServiceParam, LoggerParam } from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AdminBankingTedState } from '@zro/banking/domain';
import {
  GetAdminBankingTedByIdRequest,
  GetAdminBankingTedByIdResponse,
} from '@zro/banking/interface';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetAdminBankingTedByIdServiceKafka } from '@zro/banking/infrastructure';

export class GetBankingTedByIdRestParams {
  @ApiProperty({
    description: 'Admin Banking TED ID.',
  })
  @IsUUID(4)
  id: string;
}

export class GetBankingTedByIdRestResponse {
  @ApiProperty({
    description: 'Banking TED ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'Source Account ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  source_id: string;

  @ApiProperty({
    description: 'Destination Account ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  destination_id: string;

  @ApiProperty({
    description: 'Admin Banking TED state.',
    example: AdminBankingTedState.PENDING,
  })
  state: AdminBankingTedState;

  @ApiProperty({
    description: 'Admin Banking TED description.',
    example: 'banking ted description',
  })
  description: string;

  @ApiProperty({
    description: 'Admin Banking TED amount.',
    example: 10000,
  })
  value: number;

  @ApiProperty({
    description: 'Admin Banking TED create ID.',
    example: 1,
  })
  created_by_admin_id: number;

  @ApiProperty({
    description: 'Spread ID.',
    example: 2,
  })
  updated_by_admin_id: number;

  @ApiPropertyOptional({
    description: 'Admin Banking TED transaction ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: false,
  })
  transaction_id: string;

  @ApiPropertyOptional({
    description: 'Admin Banking TED confirmed At.',
    example: new Date(),
  })
  confirmed_at: Date;

  @ApiPropertyOptional({
    description: 'Admin Banking TED failed At.',
    example: new Date(),
  })
  failed_at: Date;

  @ApiPropertyOptional({
    description: 'Admin Banking TED forwarded At.',
    example: new Date(),
  })
  forwarded_at: Date;

  @ApiPropertyOptional({
    description: 'Admin Banking TED failure code.',
    example: '101',
  })
  failure_code: string;

  @ApiPropertyOptional({
    description: 'Admin Banking TED failure message.',
    example: 'failure message',
  })
  failure_message: string;

  @ApiPropertyOptional({
    description: 'Admin Banking TED created At.',
    example: new Date(),
  })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'Admin Banking TED updated At.',
    example: new Date(),
  })
  updated_at: Date;

  constructor(props: GetAdminBankingTedByIdResponse) {
    this.id = props.id;
    this.source_id = props.sourceId;
    this.destination_id = props.destinationId;
    this.state = props.state;
    this.description = props.description;
    this.value = props.value;
    this.created_by_admin_id = props.createdByAdminId;
    this.updated_by_admin_id = props.updatedByAdminId;
    this.transaction_id = props.transactionId;
    this.confirmed_at = props.confirmedAt;
    this.failed_at = props.failedAt;
    this.forwarded_at = props.forwardedAt;
    this.failure_code = props.failureCode;
    this.failure_message = props.failureMessage;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

/**
 * Get banking by Id controller. Controller is protected by JWT access token.
 */
@ApiTags('Banking')
@ApiBearerAuth()
@Controller('banking/teds/:id')
export class GetBankingTedByIdRestController {
  /**
   * get banking ted by id endpoint.
   */
  @ApiOperation({
    summary: 'Get Banking TED by id.',
    description: 'Get Banking TED by id.',
  })
  @ApiOkResponse({
    description: 'The banking TED returned successfully.',
    type: GetBankingTedByIdRestResponse,
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
    @AuthAdminParam() admin: AuthAdmin,
    @KafkaServiceParam(GetAdminBankingTedByIdServiceKafka)
    getBankingTedByIdService: GetAdminBankingTedByIdServiceKafka,
    @LoggerParam(GetBankingTedByIdRestController)
    logger: Logger,
    @Param() params: GetBankingTedByIdRestParams,
  ): Promise<GetBankingTedByIdRestResponse> {
    // GetAll a payload.
    const payload: GetAdminBankingTedByIdRequest = {
      id: params.id,
    };

    logger.debug('Get admin banking ted by id.', { admin, payload });

    // Call get admin banking ted by id service.
    const result = await getBankingTedByIdService.execute(payload);

    logger.debug('Get admin banking found.', { result });

    const response = result && new GetBankingTedByIdRestResponse(result);

    return response;
  }
}
