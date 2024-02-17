import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiProperty,
} from '@nestjs/swagger';
import {
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  PaginationParams,
} from '@zro/common';
import { FileRepository } from '@zro/storage/domain';
import { FileDatabaseRepository } from '@zro/storage/infrastructure';
import {
  GetAllFilesByFolderController,
  GetAllFilesByFolderRequest,
  GetAllFilesByFolderRequestSort,
  GetAllFilesByFolderResponse,
} from '@zro/storage/interface';

class GetAllFilesByFolderParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
  })
  @IsOptional()
  @IsEnum(GetAllFilesByFolderRequestSort)
  sort?: GetAllFilesByFolderRequestSort;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  folderName!: string;
}

/**
 * Get File Controller.
 */
@ApiTags('File')
@Controller('storage/files')
@MicroserviceController()
export class GetAllFilesByFolderRestController {
  /**
   * Get file endpoint.
   */
  @ApiOperation({
    summary: 'Get all Files by folder.',
    description: 'Get all Files by folder.',
  })
  @ApiOkResponse({
    description: 'The Get of Files returned successfully.',
    type: GetAllFilesByFolderResponse,
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
    @LoggerParam(GetAllFilesByFolderRestController)
    logger: Logger,
    @Query()
    params: GetAllFilesByFolderParams,
  ): Promise<GetAllFilesByFolderResponse> {
    logger.debug('Receiving files with params.', { params });

    // Call validation method.
    const payload: GetAllFilesByFolderRequest = {
      folderName: params.folderName,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    // Call get all files by folder controller interface.
    const controller = new GetAllFilesByFolderController(
      logger,
      fileRepository,
    );

    const result = await controller.execute(payload);

    logger.info('Files was found.');

    return result;
  }
}
