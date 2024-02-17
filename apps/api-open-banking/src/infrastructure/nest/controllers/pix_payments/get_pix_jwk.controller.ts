import { Logger } from 'winston';
import * as fs from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  LoggerParam,
  File,
  MissingEnvVarException,
  UnknownException,
} from '@zro/common';

interface GetPixJwkConfig {
  APP_JWKS_FILE_PATH: string;
}

/**
 * Api Open Banking Pix JWK controller.
 */
@ApiTags('Pix | JWK Set')
@Controller('.well-known/pix-jwks')
export class GetJwksFileRestController {
  private jwksFilePath: string;

  /**
   * Default constructor.
   * @param configService environment configuration.
   */
  constructor(configService: ConfigService<GetPixJwkConfig>) {
    this.jwksFilePath = configService.get<string>('APP_JWKS_FILE_PATH');

    if (!this.jwksFilePath) {
      throw new MissingEnvVarException(['APP_JWKS_FILE_PATH']);
    }
  }

  /**
   * Get pix jwk endpoint.
   */
  @ApiOperation({
    summary: 'Get Pix JWK Set.',
    description: 'Get the Pix JWK Set.',
  })
  @ApiOkResponse({
    description: 'The Pix JWK Set was returned successfully.',
  })
  @Get()
  @File()
  async execute(
    @LoggerParam(GetJwksFileRestController)
    logger: Logger,
  ): Promise<any> {
    logger.debug('Get Pix JWK Set request.', { path: this.jwksFilePath });

    try {
      const data = await fs.readFile(this.jwksFilePath, 'utf8');

      const jsonData = JSON.parse(data);

      return jsonData;
    } catch (error) {
      logger.error('Pix JWK Set file not found.', error);

      throw new UnknownException(error);
    }
  }
}
