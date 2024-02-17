import { Logger } from 'winston';
import { Controller, Param, Patch } from '@nestjs/common';
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
import { IsUUID } from 'class-validator';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  KafkaServiceParam,
  LoggerParam,
  MissingEnvVarException,
  RestServiceParam,
} from '@zro/common';
import { DeleteFileServiceRest } from '@zro/storage/infrastructure';
import { RemoveExchangeContractFileResponse } from '@zro/otc/interface';
import { RemoveExchangeContractFileServiceKafka } from '@zro/otc/infrastructure';

export class RemoveExchangeContractFileParams {
  @ApiProperty({
    description: 'File UUID.',
  })
  @IsUUID(4)
  id!: string;
}

class RemoveExchangeContractFileRestResponse {
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
    description: 'Exchange Contract created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: RemoveExchangeContractFileResponse) {
    this.id = props.id;
    this.contract_number = props.contractNumber;
    this.vet_quote = props.vetQuote;
    this.contract_quote = props.contractQuote;
    this.total_amount = props.totalAmount;
    this.created_at = props.createdAt;
  }
}

export type RemoveFileResponseDto = RemoveExchangeContractFileResponse;

interface StorageConfig {
  APP_STORAGE_BASE_URL: string;
  APP_STORAGE_EXCHANGE_CONTRACT_FOLDERNAME: string;
}

/**
 * Remove file controller. Controller is protected by JWT access token.
 */
@ApiTags('Exchange Contract')
@ApiBearerAuth()
@Controller('otc/exchange-contracts/files/:id/remove')
export class RemoveExchangeContractFileRestController {
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
   * Storage files endpoint.
   */
  @ApiOperation({
    summary: 'Remove exchange contract file.',
    description: 'Remove exchange contract pdf file.',
  })
  @ApiOkResponse({
    description: 'The storage of files returned successfully.',
    type: RemoveExchangeContractFileRestResponse,
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
  async execute(
    @Param()
    params: RemoveExchangeContractFileParams,
    @RestServiceParam(DeleteFileServiceRest)
    deleteFileServiceRest: DeleteFileServiceRest,
    @KafkaServiceParam(RemoveExchangeContractFileServiceKafka)
    removeExchangeContractFileService: RemoveExchangeContractFileServiceKafka,
    @LoggerParam(RemoveExchangeContractFileRestController)
    logger: Logger,
  ): Promise<RemoveExchangeContractFileRestResponse> {
    const { id } = params;

    // Take file out from exchange contract.
    const result = await removeExchangeContractFileService.execute({
      fileId: id,
    });

    logger.debug('File was desassociated to proper exchange contract.', {
      result,
    });

    // Call delete files service from storage.
    await deleteFileServiceRest.execute({ id }, this.axiosInstance);

    logger.debug('Files was deleted at storage.');

    const response = new RemoveExchangeContractFileRestResponse(result);

    return response;
  }
}
