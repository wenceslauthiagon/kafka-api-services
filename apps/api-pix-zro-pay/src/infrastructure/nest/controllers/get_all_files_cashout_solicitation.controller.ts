import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import { IsOptional } from 'class-validator';
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
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  RestServiceParam,
  Sort,
} from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';
import { GetAllFilesByFolderServiceRest } from '@zro/storage/infrastructure';
import { AuthCompanyParam } from '@zro/pix-zro-pay/infrastructure';
import {
  GetAllFilesByFolderResponseItem,
  GetAllFilesByFolderRequest,
  GetAllFilesByFolderResponse,
  GetAllFilesByFolderRequestSort,
} from '@zro/storage/interface';

class GetAllFilesCashOutSolicitationParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllFilesByFolderRequestSort,
  })
  @IsOptional()
  @Sort(GetAllFilesByFolderRequestSort)
  sort?: PaginationSort;
}

class GetAllFilesCashOutSolicitationRestResponseItem {
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
    description: 'File folder.',
    example: 'Teste.',
  })
  folder_name: string;

  @ApiProperty({
    description: 'File created at.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'File updated at.',
    example: new Date(),
  })
  updated_at: Date;

  constructor(props: GetAllFilesByFolderResponseItem) {
    this.id = props.id;
    this.file_name = props.fileName;
    this.folder_name = props.folderName;
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
  }
}

class GetAllFilesCashOutSolicitationRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'Files data.',
    type: [GetAllFilesCashOutSolicitationRestResponseItem],
  })
  data!: GetAllFilesCashOutSolicitationRestResponseItem[];

  constructor(props: GetAllFilesByFolderResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllFilesCashOutSolicitationRestResponseItem(item),
    );
  }
}

interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
}

/**
 * Get file Controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Transactions')
@ApiBearerAuth()
@Controller('pix/transactions/cashout-solicitation/files')
export class GetAllFilesCashOutSolicitationRestController {
  private baseURL: string;
  private axiosInstance: AxiosInstance;

  /**
   * Default constructor.
   * @param {ConfigService} configService environment configuration.
   */
  constructor(private configService: ConfigService<StorageConfig>) {
    this.baseURL = this.configService.get<string>('APP_STORAGE_BASE_URL');
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
    });
  }

  /**
   * Get all Files by folder endpoint.
   */
  @ApiOperation({
    summary: 'Get all files by folder.',
    description: 'Get all files by folder.',
  })
  @ApiOkResponse({
    description: 'The Files returned successfully.',
    type: GetAllFilesCashOutSolicitationRestResponse,
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
    @AuthCompanyParam() company: AuthCompany,
    @RestServiceParam(GetAllFilesByFolderServiceRest)
    getAllFilesByFolderServiceRest: GetAllFilesByFolderServiceRest,
    @Query() params: GetAllFilesCashOutSolicitationParams,
    @LoggerParam(GetAllFilesCashOutSolicitationRestController)
    logger: Logger,
  ): Promise<GetAllFilesCashOutSolicitationRestResponse> {
    const folderName = `${company.id}${company.name.replace(/\s/g, '')}`;

    const payload: GetAllFilesByFolderRequest = {
      folderName,
      page: params.page,
      pageSize: params.size,
      sort: params.sort,
      order: params.order,
    };

    logger.debug('Try to get all files by single folder.', {
      payload,
      company,
    });

    // Call get file service.
    const result = await getAllFilesByFolderServiceRest.execute(
      payload,
      this.axiosInstance,
    );

    logger.debug('Files found.');

    return new GetAllFilesCashOutSolicitationRestResponse(result);
  }
}
