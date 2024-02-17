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
import {
  LoggerParam,
  RestServiceParam,
  File,
  MissingEnvVarException,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { DownloadFileServiceRest } from '@zro/storage/infrastructure';

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
@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage/files/:id/download')
export class DownloadFileRestController {
  private readonly axiosInstance: AxiosInstance;

  /**
   * Default constructor.
   * @param configService environment configuration.
   */
  constructor(configService: ConfigService<StorageConfig>) {
    const baseURL = configService.get<string>('APP_STORAGE_BASE_URL');

    if (!baseURL) {
      throw new MissingEnvVarException(['APP_STORAGE_BASE_URL']);
    }

    this.axiosInstance = axios.create({ baseURL });
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
    @AuthAdminParam() admin: AuthAdmin,
    @RestServiceParam(DownloadFileServiceRest)
    downloadFileServiceRest: DownloadFileServiceRest,
    @Param() params: DownloadFileParams,
    @LoggerParam(DownloadFileRestController)
    logger: Logger,
    @Res({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    logger.debug('Download file.', { params, admin });

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
