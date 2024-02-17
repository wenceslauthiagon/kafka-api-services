import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  Controller,
  Param,
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
  ApiOkResponse,
  ApiConsumes,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  isValidFormatFile,
  KafkaServiceParam,
  LoggerParam,
  MissingEnvVarException,
  RestServiceParam,
} from '@zro/common';
import { FileFormatException } from '@zro/storage/application';
import { StorageFileServiceRest } from '@zro/storage/infrastructure';
import { UploadExchangeContractFileResponse } from '@zro/otc/interface';
import { UploadExchangeContractFileServiceKafka } from '@zro/api-admin/infrastructure';

class UploadExchangeContractFileParams {
  @ApiProperty({
    description: 'Exchange Contract UUID.',
  })
  @IsUUID(4)
  id!: string;
}

class UploadExchangeContractFileRestResponse {
  @ApiProperty({
    description: 'Exchange Contract ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Exchange Contract contract number.',
  })
  contract_number!: string;

  @ApiProperty({
    description: 'Exchange Contract vet quote.',
    example: 15.7,
  })
  vet_quote!: number;

  @ApiProperty({
    description: 'Exchange Contract contract quote.',
    example: 5.68,
  })
  contract_quote!: number;

  @ApiProperty({
    description: 'Exchange Contract total amount.',
    example: 54000,
  })
  total_amount!: number;

  @ApiProperty({
    description: 'File ID associated to Exchange Contract.',
    example: 'f72c7f03-ac35-4a81-a257-add53ce16a9c',
  })
  file_id: string;

  @ApiProperty({
    description: 'Exchange Contract created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: UploadExchangeContractFileResponse) {
    this.id = props.id;
    this.contract_number = props.contractNumber;
    this.vet_quote = props.vetQuote;
    this.contract_quote = props.contractQuote;
    this.total_amount = props.totalAmount;
    this.file_id = props.fileId;
    this.created_at = props.createdAt;
  }
}

interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
  APP_STORAGE_EXCHANGE_CONTRACT_FOLDERNAME: string;
}

/**
 * Upload file Controller. Controller is protected by JWT access token.
 */
@ApiTags('Exchange Contract')
@ApiBearerAuth()
@Controller('otc/exchange-contracts/:id/files/upload')
export class UploadExchangeContractFileRestController {
  private readonly folderName: string;
  private readonly formatFile = ['application/pdf'];
  private readonly axiosInstance: AxiosInstance;

  constructor(configService: ConfigService<StorageConfig>) {
    const baseURL = configService.get<string>('APP_STORAGE_BASE_URL');
    this.folderName = configService.get<string>(
      'APP_STORAGE_EXCHANGE_CONTRACT_FOLDERNAME',
    );

    if (!this.folderName || !baseURL) {
      throw new MissingEnvVarException([
        ...(!baseURL ? ['APP_STORAGE_BASE_URL'] : []),
        ...(!this.folderName
          ? ['APP_STORAGE_EXCHANGE_CONTRACT_FOLDERNAME']
          : []),
      ]);
    }

    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * Storage files endpoint.
   */
  @ApiOperation({
    summary: 'Upload exchange contract file.',
    description: 'Upload exchange contract pdf file.',
  })
  @ApiOkResponse({
    description: 'The storage of files returned successfully.',
    type: UploadExchangeContractFileRestResponse,
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
    @Param()
    params: UploadExchangeContractFileParams,
    @UploadedFile()
    file: Express.Multer.File,
    @RestServiceParam(StorageFileServiceRest)
    uploadFilesServiceRest: StorageFileServiceRest,
    @KafkaServiceParam(UploadExchangeContractFileServiceKafka)
    uploadExchangeContractService: UploadExchangeContractFileServiceKafka,
    @LoggerParam(UploadExchangeContractFileRestController)
    logger: Logger,
  ): Promise<UploadExchangeContractFileRestResponse> {
    logger.debug('Receiving files to storage.', { params });

    // TODO: Create a validator to check if there is a file to upload
    const isValidFormat = isValidFormatFile(file?.mimetype, this.formatFile);
    if (!isValidFormat) {
      throw new FileFormatException(file?.mimetype);
    }

    const fileId = uuidV4();

    const result = await uploadExchangeContractService.execute({
      id: params.id,
      fileId,
    });

    logger.debug('File was associated to proper exchange contract.', {
      result,
    });

    // Call upload files service.
    const resultFile = await uploadFilesServiceRest.execute(
      fileId,
      file.buffer,
      this.folderName,
      file.originalname,
      this.axiosInstance,
    );

    logger.debug('Files was storaged.', { resultFile });

    const response = new UploadExchangeContractFileRestResponse(result);

    return response;
  }
}
