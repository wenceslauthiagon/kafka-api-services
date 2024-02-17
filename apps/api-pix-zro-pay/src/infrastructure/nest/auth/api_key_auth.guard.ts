import { createHash } from 'crypto';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { isObservable, lastValueFrom } from 'rxjs';
import { IS_PUBLIC_KEY, RedisService } from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';

/**
 * Grant access to endpoints if company sent the x-api-key in header.
 */
@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
  /**
   * Default guard constructor that calls AuthGuard constructor.
   * @param reflector Access to class or method modifiers.
   * @param redisService Remember previous authentication.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if requested controller or handler is public.
    // Controller or handler decorated with @Public are skipped from JWT validation.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Is controller or handler public?
    if (isPublic) {
      // Yes! Left protection to be specified by controler or handler.
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const { headers } = req;

    if (!headers?.['x-api-key']) {
      return false;
    }

    const token: string = headers['x-api-key'];
    const hash = createHash('sha1').update(token).digest('base64');

    // Check if a previous authorization-company exists.
    const cached = await this.redisService.get<AuthCompany>(
      `authorization-company-${hash}`,
    );

    if (cached) {
      req.company = cached.data;
      return true;
    }

    // No! The controller or handler is protected, so check api key sent by the company.
    const active = super.canActivate(context);

    if (!active) return false;

    if (isObservable(active)) {
      return lastValueFrom(active);
    } else {
      return active;
    }
  }
}
