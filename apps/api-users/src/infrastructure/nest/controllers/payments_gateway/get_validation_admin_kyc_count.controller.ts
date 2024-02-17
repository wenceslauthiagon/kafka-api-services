import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional, IsString, Matches } from 'class-validator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  LoggerParam,
  DefaultApiHeaders,
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
  KafkaServiceParam,
  HasPermission,
} from '@zro/common';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { GetValidationAdminKycCountServiceKafka } from '@zro/payments-gateway/infrastructure';
import { GetValidationAdminKycCountRequest } from '@zro/payments-gateway/interface';

export class GetValidationAdminKycCountParams {
  @ApiPropertyOptional({
    description: 'Company.',
  })
  @IsString()
  @IsOptional()
  @Matches(/^$|^((random)|[0-9]+)$/, {
    message: 'Company is not in the correct format',
  })
  company?: string;

  @ApiPropertyOptional({
    description: 'Filter by date range. Start from date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date start date',
  })
  @IsDateBeforeThan('end_date', true, {
    message: 'Created start date must be before than end date',
  })
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range. Filter until date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format date created end date',
  })
  @IsDateAfterThan('start_date', true, {
    message: 'Created end date must be after than created start date',
  })
  end_date?: string;
}

export class GetValidationAdminKycCountRestResponse {
  @ApiProperty({
    description: 'Total Validation kyc count found.',
    example: 100,
  })
  total: number;

  constructor(props: GetValidationAdminKycCountRestResponse) {
    this.total = props.total;
  }
}

/**
 * Get Validation Admin Kyc Count Controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Kyc')
@Controller('payments-gateway/validation/admin/kyc/count')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-admin-kyc-count')
export class GetValidationAdminKycCountRestController {
  /**
   * Validation kyc count endpoint.
   */
  @ApiOperation({
    summary: 'Validation admin kyc count.',
    description: 'Validation kyc count.',
  })
  @ApiOkResponse({
    description: 'The validation admin kyc count returned successfully.',
    type: GetValidationAdminKycCountRestResponse,
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
    @Query() params: GetValidationAdminKycCountParams,
    @KafkaServiceParam(GetValidationAdminKycCountServiceKafka)
    service: GetValidationAdminKycCountServiceKafka,
    @LoggerParam(GetValidationAdminKycCountRestController)
    logger: Logger,
  ): Promise<GetValidationAdminKycCountRestResponse> {
    // Creates a payload
    const payload: GetValidationAdminKycCountRequest = {
      wallet_id: wallet.id,
      company: params.company,
      start_date: params.start_date,
      end_date: params.end_date,
    };

    logger.debug('Get validation admin kyc count.', {
      user,
      wallet,
      payload,
    });

    // Call validation kyc count service.
    const result = await service.execute(payload);

    logger.debug('Found validation admin kyc count.', { result });

    const response =
      result && new GetValidationAdminKycCountRestResponse(result);

    return response;
  }
}
