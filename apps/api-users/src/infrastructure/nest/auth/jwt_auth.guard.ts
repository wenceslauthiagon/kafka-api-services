import { createHash } from 'crypto';
import { isObservable, lastValueFrom } from 'rxjs';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, RedisService } from '@zro/common';
import { AuthUser } from '@zro/users/domain';

/**
 * Grant access to endpoints if user sent a access token.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Default guard constructor that calls AuthGuard constructor.
   * @param reflector Access to class or method modifiers.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  /**
   * Custom JWT guard implementation. Allow some controller or handlers to be
   * exposed to internet without JWT protection.
   * @param context Request context.
   * @returns
   */
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

    if (!headers?.['authorization']) {
      return false;
    }

    const token: string = headers['authorization'];
    const hash = createHash('sha1').update(token).digest('base64');

    // Check if a previous authorization exists.
    const cached = await this.redisService.get<AuthUser>(
      `authorization-${hash}`,
    );

    if (cached) {
      req.user = cached.data;
      return true;
    }

    // No! Controller or handler are protected, so check JWT sent by user.
    const active = await super.canActivate(context);

    if (!active) return false;

    if (isObservable(active)) {
      return lastValueFrom(active);
    } else {
      return active;
    }
  }
}
