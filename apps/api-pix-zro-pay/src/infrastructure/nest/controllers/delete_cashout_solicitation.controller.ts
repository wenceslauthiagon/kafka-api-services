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
import { LoggerParam, RestServiceParam } from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';
import { DeleteFileServiceRest } from '@zro/storage/infrastructure';
import { AuthCompanyParam } from '@zro/pix-zro-pay/infrastructure';

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
@ApiTags('Pix | Transactions')
@ApiBearerAuth()
@Controller('pix/transactions/cashout-solicitation/files/:id')
export class DeleteCashOutSolicitationRestController {
  private baseURL: string;
  private axiosInstance: AxiosInstance;
  /**
   * Default constructor.
   */
  constructor(private configService: ConfigService<StorageConfig>) {
    this.baseURL = this.configService.get<string>('APP_STORAGE_BASE_URL');
    this.axiosInstance = axios.create({ baseURL: this.baseURL });
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
    @AuthCompanyParam() company: AuthCompany,
    @RestServiceParam(DeleteFileServiceRest)
    deleteFileServiceRest: DeleteFileServiceRest,
    @Param() params: DeleteFileParams,
    @LoggerParam(DeleteCashOutSolicitationRestController)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Delete file by id.', { params, company });

    const { id } = params;

    // Call delete file service.

    await deleteFileServiceRest.execute({ id }, this.axiosInstance);
  }
}
