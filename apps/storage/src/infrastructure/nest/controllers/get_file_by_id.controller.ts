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
} from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import { FileDatabaseRepository } from '@zro/storage/infrastructure';
import {
  GetFileByIdController,
  GetFileByIdRequest,
  GetFileByIdResponse,
} from '@zro/storage/interface';

/**
 * Get file by id controller.
 */
@ApiTags('File')
@Controller('storage/files/:id')
@MicroserviceController()
export class GetFileByIdRestController {
  /**
   * Get file by id endpoint.
   */
  @ApiOperation({
    summary: 'Get file by id.',
    description: 'Get file by id.',
  })
  @ApiOkResponse({
    description: 'Get file by id returned successfully.',
    type: GetFileByIdResponse,
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
  async execute(
    @RepositoryParam(FileDatabaseRepository)
    fileRepository: FileRepository,
    @LoggerParam(GetFileByIdRestController)
    logger: Logger,
    @Param() params: GetFileByIdRequest,
  ): Promise<GetFileByIdResponse> {
    logger.debug('Receiving file.', { params });

    // Call get file by id controller interface.
    const controller = new GetFileByIdController(logger, fileRepository);

    const result = await controller.execute(params);

    logger.info('File was found passing id.', { result });

    return result;
  }
}
