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
import { LoggerParam, RestServiceParam } from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';
import { GetFileByIdServiceRest } from '@zro/storage/infrastructure';
import { AuthCompanyParam } from '@zro/pix-zro-pay/infrastructure';
import { GetFileByIdResponse } from '@zro/storage/interface';

class GetFileByIdCashoutSolicitationParams {
  @ApiProperty({
    description: 'File ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

class GetFileByIdCashoutSolicitationRestResponse {
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
@ApiTags('Pix | Transactions')
@ApiBearerAuth()
@Controller('pix/transactions/cashout-solicitation/files/:id')
export class GetFileByIdCashoutSolicitationRestController {
  private baseURL: string;
  private axiosInstance: AxiosInstance;

  /**
   * Default constructor.
   * @param {ConfigService} configService environment.
   */
  constructor(private configService: ConfigService<StorageConfig>) {
    this.baseURL = this.configService.get<string>('APP_STORAGE_BASE_URL');
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
    });
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
    type: GetFileByIdCashoutSolicitationRestResponse,
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
    @RestServiceParam(GetFileByIdServiceRest)
    getFileByIdServiceRest: GetFileByIdServiceRest,
    @Param() params: GetFileByIdCashoutSolicitationParams,
    @LoggerParam(GetFileByIdCashoutSolicitationRestController)
    logger: Logger,
  ): Promise<GetFileByIdCashoutSolicitationRestResponse> {
    // Get file by id payload.
    const payload: GetFileByIdCashoutSolicitationParams = {
      id: params.id,
    };

    logger.debug('Try to get file by id folder.', { payload, company });

    // Call get file service.
    const result = await getFileByIdServiceRest.execute(
      payload,
      this.axiosInstance,
    );

    logger.debug('Specific file found.', { result });

    const response =
      result && new GetFileByIdCashoutSolicitationRestResponse(result);

    return response;
  }
}
