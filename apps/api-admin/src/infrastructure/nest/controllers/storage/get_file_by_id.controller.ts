import { Logger } from 'winston';
import { Controller, Get, Param } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
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
import {
  LoggerParam,
  MissingEnvVarException,
  RestServiceParam,
} from '@zro/common';
import { AuthAdmin } from '@zro/api-admin/domain';
import { AuthAdminParam } from '@zro/api-admin/infrastructure';
import { GetFileByIdServiceRest } from '@zro/storage/infrastructure';
import { GetFileByIdResponse } from '@zro/storage/interface';

class GetFileByIdParams {
  @ApiProperty({
    description: 'File ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

class GetFileByIdRestResponse {
  @ApiProperty({
    description: 'File ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'File name.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa-Ordem_de_Remessas.xlsx',
  })
  file_name: string;

  @ApiProperty({
    description: 'File created at.',
    example: new Date(),
  })
  created_at: Date;

  constructor(props: GetFileByIdResponse) {
    this.id = props.id;
    this.file_name = props.fileName;
    this.created_at = props.createdAt;
  }
}

interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
}

/**
 * Get file by id Controller. Controller is protected by JWT access token.
 */
@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage/files/:id')
export class GetFileByIdRestController {
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
   * Get file by id endpoint.
   */
  @ApiOperation({
    summary: 'Get file by id.',
    description: 'Get file by id.',
  })
  @ApiOkResponse({
    description: 'The File returned successfully.',
    type: GetFileByIdRestResponse,
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
    @AuthAdminParam() admin: AuthAdmin,
    @RestServiceParam(GetFileByIdServiceRest)
    getFileByIdServiceRest: GetFileByIdServiceRest,
    @Param() params: GetFileByIdParams,
    @LoggerParam(GetFileByIdRestController)
    logger: Logger,
  ): Promise<GetFileByIdRestResponse> {
    // Get file by id payload.
    const payload: GetFileByIdParams = {
      id: params.id,
    };

    logger.debug('Try to get file by id folder.', { payload, admin });

    // Call get file service.
    const result = await getFileByIdServiceRest.execute(
      payload,
      this.axiosInstance,
    );

    logger.debug('Specific file found.', { result });

    const response = result && new GetFileByIdRestResponse(result);

    return response;
  }
}
