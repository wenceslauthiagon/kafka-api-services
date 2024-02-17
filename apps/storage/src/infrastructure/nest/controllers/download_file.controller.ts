import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  File,
} from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import { StorageGateway } from '@zro/storage/application';
import { FileDatabaseRepository } from '@zro/storage/infrastructure';
import {
  DownloadFileController,
  DownloadFileRequest,
  DownloadFileResponse,
} from '@zro/storage/interface';
import { S3StorageGatewayParam, S3StorageInterceptor } from '@zro/s3-storage';

/**
 * Get File Controller.
 */
@ApiTags('File')
@Controller('storage/files/:id/download')
@MicroserviceController([S3StorageInterceptor])
export class DownloadFileRestController {
  /**
   * Get file endpoint.
   */
  @ApiOperation({
    summary: 'Download File.',
    description: 'Download File.',
  })
  @ApiOkResponse({
    description: 'The download of File returned successfully.',
    type: DownloadFileResponse,
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
    @RepositoryParam(FileDatabaseRepository)
    fileRepository: FileRepository,
    @LoggerParam(DownloadFileRestController)
    logger: Logger,
    @S3StorageGatewayParam()
    pspGateway: StorageGateway,
    @Param() params: DownloadFileRequest,
  ): Promise<DownloadFileResponse> {
    logger.debug('Receiving file.', { params });

    // Call get file controller interface.
    const controller = new DownloadFileController(
      logger,
      fileRepository,
      pspGateway,
    );

    const result = await controller.execute(params);

    logger.info('File was found.');

    return result;
  }
}
