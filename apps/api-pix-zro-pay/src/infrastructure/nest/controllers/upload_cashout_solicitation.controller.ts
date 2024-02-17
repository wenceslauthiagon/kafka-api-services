import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  Controller,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  isValidFormatFile,
  LoggerParam,
  MissingEnvVarException,
  RestServiceParam,
} from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';
import { FileFormatException } from '@zro/storage/application';
import { StorageFileServiceRest } from '@zro/storage/infrastructure';
import { AuthCompanyParam } from '@zro/pix-zro-pay/infrastructure';

interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
}

/**
 * Upload file Controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Transactions')
@ApiBearerAuth()
@Controller('pix/transactions/cashout-solicitation/files/upload')
export class UploadCashOutSolicitationFileRestController {
  private baseURL: string;
  private formatFile = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];
  private axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService<StorageConfig>) {
    this.baseURL = this.configService.get<string>('APP_STORAGE_BASE_URL');

    if (!this.baseURL) {
      throw new MissingEnvVarException([
        ...(!this.baseURL ? ['APP_STORAGE_BASE_URL'] : []),
      ]);
    }

    this.axiosInstance = axios.create({ baseURL: this.baseURL });
  }

  /**
   * Storage files endpoint.
   */
  @ApiOperation({
    summary: 'Upload cash out solicitation file.',
    description: 'Upload cash out solicitation pdf file.',
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
  @Patch()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async execute(
    @AuthCompanyParam() company: AuthCompany,
    @UploadedFile() file: Express.Multer.File,
    @RestServiceParam(StorageFileServiceRest)
    uploadFilesServiceRest: StorageFileServiceRest,
    @LoggerParam(UploadCashOutSolicitationFileRestController)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Receiving files to storage.');

    // TODO: Create a validator to check if there is a file to upload
    const isValidFormat = isValidFormatFile(file?.mimetype, this.formatFile);
    if (!isValidFormat) {
      throw new FileFormatException(file?.mimetype);
    }

    const fileId = uuidV4();

    logger.debug('File was associated to proper cash out solicitation.');

    const folderName = `${company.id}${company.name.replace(/\s/g, '')}`;

    // Call upload files service.
    const resultFile = await uploadFilesServiceRest.execute(
      fileId,
      file.buffer,
      folderName,
      file.originalname,
      this.axiosInstance,
    );

    logger.debug('Files was storaged.', { resultFile });
  }
}
