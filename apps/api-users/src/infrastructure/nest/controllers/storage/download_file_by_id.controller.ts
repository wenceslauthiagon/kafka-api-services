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
  ApiProperty,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  LoggerParam,
  RestServiceParam,
  File,
  DefaultApiHeaders,
  HasPermission,
  MissingEnvVarException,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { DownloadFileServiceRest } from '@zro/storage/infrastructure';

class DownloadFileByIdParams {
  @ApiProperty({
    description: 'File ID.',
  })
  @IsUUID(4)
  id!: string;
}

interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
}

/**
 * Download file by ID Controller. Controller is protected by JWT access token.
 */
@ApiTags('Storage')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('storage/files/:id/download')
@HasPermission('api-users-get-storage-files-download-by-id')
export class DownloadFileByIdRestController {
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
   * Download file by ID endpoint.
   */
  @ApiOperation({
    summary: 'Download file by ID.',
    description:
      "Download file by ID. Enter the file's ID below and execute to initiate the download. If you haven't generated a file ID yet, please generate it using the appropriate endpoint.",
  })
  @ApiOkResponse({
    description: 'The file download returned successfully.',
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
    @RestServiceParam(DownloadFileServiceRest)
    downloadFileServiceRest: DownloadFileServiceRest,
    @Param() params: DownloadFileByIdParams,
    @LoggerParam(DownloadFileByIdRestController)
    logger: Logger,
    @Res({ passthrough: true }) res,
  ): Promise<StreamableFile> {
    logger.debug('Download file.', { params, user });

    const { id } = params;

    // Call download file service.
    const { fileStream, fileName } = await downloadFileServiceRest.execute(
      { id },
      this.axiosInstance,
    );

    res.set({
      'Content-Disposition': `attachment; filename=${fileName}`,
    });

    logger.debug('Found file.');

    return new StreamableFile(Buffer.from(fileStream));
  }
}
