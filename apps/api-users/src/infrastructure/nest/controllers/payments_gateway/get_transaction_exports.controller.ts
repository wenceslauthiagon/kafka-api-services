import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { Controller, Get, StreamableFile, Res, Query } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import {
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
  LoggerParam,
  RestServiceParam,
  File,
  DefaultApiHeaders,
  HasPermission,
  IsIsoStringDateFormat,
  IsDateBeforeThan,
  IsDateAfterThan,
} from '@zro/common';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import { AuthUserParam } from '@zro/users/infrastructure';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { TransactionExportsServiceRest } from '@zro/payments-gateway/infrastructure';
import { TransactionExportsRequest } from '@zro/payments-gateway/interface';
import { PaymentsGatewayAxiosService } from '@zro/api-users/infrastructure';

export class TransactionExportsParams {
  @ApiPropertyOptional({
    description: 'Filter by transaction ID.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  id?: string;

  @ApiPropertyOptional({
    description: 'Filter by deposit UUID.',
  })
  @IsOptional()
  @IsUUID(4)
  uuid?: string;

  @ApiPropertyOptional({
    description: 'Filter by client name.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  client_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by client document.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  client_document?: string;

  @ApiPropertyOptional({
    description: 'Filter by client email.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  client_email?: string;

  @ApiPropertyOptional({
    description: 'Filter by PIX key type.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  type_key_pix?: string;

  @ApiPropertyOptional({
    description: 'Filter by PIX key.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  key_pix?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range. Start from date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Start date invalid format.',
  })
  @IsDateBeforeThan('created_end_date', true, {
    message: 'Start date must be before end date.',
  })
  created_start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range. Filter until date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'End date invalid format.',
  })
  @IsDateAfterThan('created_start_date', true, {
    message: 'End date must be after start date.',
  })
  created_end_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by last update date range. Filter from date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'Start date invalid format.',
  })
  @IsDateBeforeThan('updated_end_date', true, {
    message: 'Start date must be before end date.',
  })
  updated_start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by last update date range. Filter until date:',
  })
  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ssZ', {
    message: 'End date invalid format.',
  })
  @IsDateAfterThan('updated_start_date', true, {
    message: 'End date must be after start date.',
  })
  updated_end_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by status.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by company ID.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by bank name.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  bank_name?: string;

  @ApiPropertyOptional({
    description: 'Transaction type.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_type?: string;

  @ApiPropertyOptional({
    description: 'End to end id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  end_to_end?: string;
}

/**
 * Transaction Exports Controller. Controller is protected by JWT access token.
 */
@ApiTags('Payments Gateway | Exports')
@Controller('payments-gateway/transactions/exports')
@DefaultApiHeaders()
@ApiBearerAuth()
@WalletApiHeader()
@HasPermission('api-users-get-payments-gateway-transaction-exports')
export class GetTransactionExportsRestController {
  private axiosInstance: AxiosInstance;
  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    private paymentsGatewayAxiosService: PaymentsGatewayAxiosService,
  ) {
    this.axiosInstance = this.paymentsGatewayAxiosService.create();
  }

  /**
   * Download transaction exports file endpoint.
   */
  @ApiOperation({
    summary: 'Download transaction exports file.',
    description: 'Download transaction file.',
  })
  @ApiOkResponse({
    description: 'The download of File returned successfully.',
    type: null,
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
  @File()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Query() params: TransactionExportsParams,
    @RestServiceParam(TransactionExportsServiceRest)
    transactionExportsServiceRest: TransactionExportsServiceRest,
    @LoggerParam(GetTransactionExportsRestController)
    logger: Logger,
    @Res({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    // Creates a payload
    const payload: TransactionExportsRequest = {
      wallet_id: wallet.id,
      id: params.id,
      uuid: params.uuid,
      client_name: params.client_name,
      client_document: params.client_document,
      client_email: params.client_email,
      type_key_pix: params.type_key_pix,
      key_pix: params.key_pix,
      created_start_date: params.created_start_date,
      created_end_date: params.created_end_date,
      updated_start_date: params.updated_start_date,
      updated_end_date: params.updated_end_date,
      status: params.status,
      company_id: params.company_id,
      bank_name: params.bank_name,
      transaction_type: params.transaction_type,
      end_to_end: params.end_to_end,
    };

    logger.debug('Download transaction exports file.', {
      user,
      wallet,
      payload,
    });

    const result = await transactionExportsServiceRest.execute(
      payload,
      this.axiosInstance,
    );
    res.set({
      'Content-Disposition': `attachment; filename=${uuidV4()}_transaction_exports.csv`,
    });

    return new StreamableFile(Buffer.from(result));
  }
}
