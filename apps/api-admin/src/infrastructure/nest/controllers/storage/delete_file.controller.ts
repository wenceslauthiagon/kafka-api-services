import { Logger } from 'winston';
import { Controller, Param, Delete } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
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
  MissingEnvVarException,
  RestServiceParam,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { DeleteFileServiceRest } from '@zro/storage/infrastructure';

class DeleteFileParams {
  @ApiPropertyOptional({
    description: 'File ID.',
  })
  @IsUUID(4)
  id!: string;
}

interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
}

/**
 * Delete file Controller. Controller is protected by JWT access token.
 */
@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage/files/:id')
export class DeleteFileRestController {
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
   * Delete file endpoint.
   */
  @ApiOperation({
    summary: 'Delete File.',
    description: 'Delete File.',
  })
  @ApiOkResponse({
    description: 'The Delete of File returned successfully.',
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
  @Delete()
  async execute(
    @AuthAdminParam() admin: AuthAdmin,
    @RestServiceParam(DeleteFileServiceRest)
    deleteFileServiceRest: DeleteFileServiceRest,
    @Param() params: DeleteFileParams,
    @LoggerParam(DeleteFileRestController)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Delete file by id.', { params, admin });

    const { id } = params;

    // Call delete file service.
    await deleteFileServiceRest.execute({ id }, this.axiosInstance);
  }
}
