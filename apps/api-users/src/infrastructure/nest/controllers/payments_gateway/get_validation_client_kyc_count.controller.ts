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
import { GetValidationClientKycCountServiceKafka } from '@zro/payments-gateway/infrastructure';
import { GetValidationClientKycCountRequest } from '@zro/payments-gateway/interface';

export class GetValidationClientKycCountParams {
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

export class GetValidationClientKycCountRestResponse {
  @ApiProperty({
    description: 'Total Validation client kyc count found.',
    example: 100,
  })
  total: number;

  constructor(props: GetValidationClientKycCountRestResponse) {
    this.total = props.total;
  }
}

/**
 * Get Validation Client Kyc Count Controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Kyc')
@Controller('payments-gateway/validation/client/kyc/count')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-client-kyc-count')
export class GetValidationClientKycCountRestController {
  /**
   * Validation kyc count endpoint.
   */
  @ApiOperation({
    summary: 'Validation client kyc count.',
    description: 'Validation client kyc count.',
  })
  @ApiOkResponse({
    description: 'The validation client kyc count returned successfully.',
    type: GetValidationClientKycCountRestResponse,
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
    @Query() params: GetValidationClientKycCountParams,
    @KafkaServiceParam(GetValidationClientKycCountServiceKafka)
    service: GetValidationClientKycCountServiceKafka,
    @LoggerParam(GetValidationClientKycCountRestController)
    logger: Logger,
  ): Promise<GetValidationClientKycCountRestResponse> {
    // Creates a payload
    const payload: GetValidationClientKycCountRequest = {
      wallet_id: wallet.id,
      company: params.company,
      start_date: params.start_date,
      end_date: params.end_date,
    };

    logger.debug('Get validation client kyc count.', {
      user,
      wallet,
      payload,
    });

    // Call validation kyc count service.
    const result = await service.execute(payload);

    logger.debug('Found validation client kyc count.', { result });

    const response =
      result && new GetValidationClientKycCountRestResponse(result);

    return response;
  }
}
