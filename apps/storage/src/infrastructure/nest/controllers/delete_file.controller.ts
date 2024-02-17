import { Logger } from 'winston';
import { Controller, Delete, Param } from '@nestjs/common';
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
} from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import { FileDatabaseRepository } from '@zro/storage/infrastructure';
import {
  DeleteFileController,
  DeleteFileRequest,
} from '@zro/storage/interface';
import { StorageGateway } from '@zro/storage/application';
import { S3StorageGatewayParam, S3StorageInterceptor } from '@zro/s3-storage';

/**
 * Delete file Controller.
 */
@ApiTags('File')
@Controller('storage/files/:id')
@MicroserviceController([S3StorageInterceptor])
export class DeleteFileRestController {
  /**
   * Delete file endpoint.
   */
  @ApiOperation({
    summary: 'Delete File.',
    description: 'Delete File.',
  })
  @ApiOkResponse({
    description: 'The Delete of File returned successfully.',
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
  @Delete()
  async execute(
    @RepositoryParam(FileDatabaseRepository)
    fileRepository: FileRepository,
    @LoggerParam(DeleteFileRestController)
    logger: Logger,
    @S3StorageGatewayParam()
    pspGateway: StorageGateway,
    @Param() params: DeleteFileRequest,
  ): Promise<void> {
    logger.debug('Receiving file.', { params });

    // Call delete file controller interface.
    const controller = new DeleteFileController(
      logger,
      fileRepository,
      pspGateway,
    );

    await controller.execute(params);

    logger.info('File was deleted.');
  }
}
