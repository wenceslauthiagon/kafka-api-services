import { Logger } from 'winston';
import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  NotImplementedException,
  ProtocolType,
  InjectLogger,
  RedisService,
} from '@zro/common';
import { AccessToken, RefreshTokenCache } from '@zro/api-paas/domain';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {
    this.logger = logger.child({ context: RefreshTokenGuard.name });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request: any = null;

    // Check if it is a HTTP request.
    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    const requestId = request.id;
    const logger = this.logger.child({ loggerId: requestId });

    const { headers } = request;

    // Check if x-access-token exists
    if (!headers?.['x-access-token']) {
      throw new UnauthorizedException();
    }

    logger.debug('Validate refresh token.');

    const token: string = headers['x-access-token'];
    const verifiedToken = this.jwtService.decode<AccessToken>(token);

    // Check if refresh token exists.
    const cached = await this.redisService.get<RefreshTokenCache>(
      `refresh-token-paas-${verifiedToken.id}`,
    );

    if (cached?.data) {
      const cachedData = cached.data;

      if (
        cachedData?.refreshToken?.uuid === verifiedToken?.refresh_token?.uuid
      ) {
        logger.info('Validate refresh token user authorized.');
        request.user = cachedData.user;
        return true;
      }
    } else {
      logger.info('Do not validate an invalid access token.');
      throw new UnauthorizedException();
    }

    logger.info('Do not authorize refresh token.');

    return false;
  }
}
