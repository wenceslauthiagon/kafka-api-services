import { Logger } from 'winston';
import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { StorageGateway } from '@zro/storage/application';
import { FileDatabaseRepository } from '@zro/storage/infrastructure';
import {
  UploadFileController,
  UploadFileRequest,
  UploadFileResponse,
} from '@zro/storage/interface';
import { S3StorageGatewayParam, S3StorageInterceptor } from '@zro/s3-storage';

/**
 * Upload file Controller.
 */
@ApiTags('File')
@Controller('storage/files/upload')
@MicroserviceController([S3StorageInterceptor])
export class UploadFileRestController {
  /**
   * Storage files endpoint.
   */
  @ApiOperation({
    summary: 'Upload File.',
    description: 'Upload File.',
  })
  @ApiOkResponse({
    description: 'The storage of Files returned successfully.',
    type: UploadFileResponse,
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
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async execute(
    @UploadedFile()
    file: Express.Multer.File,
    @RepositoryParam(FileDatabaseRepository)
    fileRepository: FileRepository,
    @LoggerParam(UploadFileRestController)
    logger: Logger,
    @S3StorageGatewayParam()
    pspGateway: StorageGateway,
    @Query() params: UploadFileRequest,
  ): Promise<UploadFileResponse> {
    logger.debug('Receiving file to storage.', { params });

    const controller = new UploadFileController(
      logger,
      fileRepository,
      pspGateway,
    );

    // Call upload file controller interface.
    const result = await controller.execute(file, params);

    logger.debug('Files was storaged.');

    return result;
  }
}
