import { Logger } from 'winston';
import { Controller, Param, Get, StreamableFile, Res } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import axios, { AxiosInstance } from 'axios';
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
import { ConfigService } from '@nestjs/config';
import { LoggerParam, RestServiceParam, File } from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';
import { DownloadFileServiceRest } from '@zro/storage/infrastructure';
import { AuthCompanyParam } from '@zro/pix-zro-pay/infrastructure';

class DownloadFileParams {
  @ApiPropertyOptional({
    description: 'File ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
}

/**
 * Download file Controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Transactions')
@ApiBearerAuth()
@Controller('pix/transactions/cashout-solicitation/files/download/:id')
export class DownloadCashOutSolicitationRestController {
  private baseURL: string;
  private axiosInstance: AxiosInstance;
  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(private configService: ConfigService<StorageConfig>) {
    this.baseURL = this.configService.get<string>('APP_STORAGE_BASE_URL');
    this.axiosInstance = axios.create({ baseURL: this.baseURL });
  }

  /**
   * Download file endpoint.
   */
  @ApiOperation({
    summary: 'Download File.',
    description: 'Download File.',
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
    @AuthCompanyParam() company: AuthCompany,
    @RestServiceParam(DownloadFileServiceRest)
    downloadFileServiceRest: DownloadFileServiceRest,
    @Param() params: DownloadFileParams,
    @LoggerParam(DownloadCashOutSolicitationRestController)
    logger: Logger,
    @Res({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    logger.debug('Download file.', { params, company });

    const { id } = params;

    // Call download file service.
    const { fileStream, fileName } = await downloadFileServiceRest.execute(
      { id },
      this.axiosInstance,
    );

    res.set({
      'Content-Disposition': `attachment; filename=${fileName}`,
    });

    logger.debug('Files export file found.');

    return new StreamableFile(Buffer.from(fileStream));
  }
}
