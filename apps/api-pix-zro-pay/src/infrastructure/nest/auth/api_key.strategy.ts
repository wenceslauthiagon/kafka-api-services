import { v4 as uuidV4 } from 'uuid';
import { Milliseconds } from 'cache-manager';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { Logger } from 'winston';
import { createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ApiKeyConfig } from './api_key.config';
import { InjectLogger, KafkaService, RedisService } from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';
import { GetCompanyByIdAndXApiKeyServiceKafka } from '@zro/pix-zro-pay/infrastructure';
import {
  GetCompanyByIdAndXApiKeyRequest,
  GetCompanyByIdAndXApiKeyResponse,
} from '@zro/pix-zro-pay/interface';

/**
 * Implement the x api key authentication strategy.
 * Get the x api key from authentication header and verify.
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'api-key',
) {
  private readonly ttl: Milliseconds;
  /**
   * Default constructor. Instanciate service to verify and decode apiKey
   *
   * @param kafkaService Kafka service.
   * @param logger Global logger
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    configService: ConfigService<ApiKeyConfig>,
    @InjectLogger() private logger: Logger,
  ) {
    super(
      { header: 'x-api-key', prefix: '' },
      true,
      (
        apikey: string,
        next: (err: Error, verified?: boolean) => void,
        req?: any,
      ) => this.validate(apikey, next, req),
    );
    this.logger = logger.child({ context: ApiKeyStrategy.name });
    this.ttl = configService.get<number>('APP_API_KEY_CACHE_TTL_S', 60) * 1000;
  }

  /**
   * @param payload The api key.
   * @param next The next.
   * @param request The next.
   */
  async validate(
    payload: string,
    next: (err: Error, verified?: boolean) => void,
    req?: any,
  ): Promise<void> {
    this.logger.debug('Payload.', { payload });
    const requestId = uuidV4();

    this.logger = this.logger.child({ loggerId: requestId });

    if (!payload) {
      return next(new UnauthorizedException());
    }

    const decodedPayload = atob(payload).split(':');
    const companyId = Number(decodedPayload[0]);
    const companyXApiKey = decodedPayload[1];

    if (!companyId || !companyXApiKey) {
      this.logger.debug('Error when decode api key.');
      return next(new UnauthorizedException());
    }

    const companyFound = await this.getCompanyByIdAndXApiKey(
      requestId,
      companyId,
      companyXApiKey,
    );

    // If no company found, kick company.
    if (!companyFound) {
      this.logger.error('Company not found.');
      return next(new UnauthorizedException());
    }

    const authCompany: AuthCompany = {
      id: companyFound.id,
      name: companyFound.name,
      cnpj: companyFound.cnpj,
    };

    const { headers } = req;

    if (headers?.['x-api-key']) {
      const token: string = headers['x-api-key'];
      const hash = createHash('sha1').update(token).digest('base64');

      await Promise.all([
        this.redisService.set<AuthCompany>({
          key: `authorization-company-${hash}`,
          data: authCompany,
          ttl: this.ttl,
        }),
        this.redisService.set<string>({
          key: `authorization-company-${authCompany.id}`,
          data: hash,
          ttl: this.ttl,
        }),
      ]);

      req.company = authCompany;
    }

    return next(null, true);
  }

  private async getCompanyByIdAndXApiKey(
    requestId: string,
    id: number,
    xApiKey: string,
  ): Promise<GetCompanyByIdAndXApiKeyResponse> {
    // Create a request.
    const request = new GetCompanyByIdAndXApiKeyRequest({ id, xApiKey });

    const GetCompanyByIdAndXApiKeyService =
      new GetCompanyByIdAndXApiKeyServiceKafka(
        requestId,
        this.logger,
        this.kafkaService,
      );

    // Send request to company service.
    const company = await GetCompanyByIdAndXApiKeyService.execute(request);

    this.logger.debug('Company authenticated.', { company });

    return company;
  }
}
