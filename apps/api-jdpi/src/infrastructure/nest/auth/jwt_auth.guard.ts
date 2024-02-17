import { ExecutionContext, Injectable } from '@nestjs/common';
import { isObservable, lastValueFrom } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@zro/common';

/**
 * Grant access to endpoints if client sent an access token.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Default guard constructor that calls AuthGuard constructor.
   * @param reflector Access to class or method modifiers.
   */
  constructor(private readonly reflector: Reflector) {
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

    // No! Controller or handler are protected, so check JWT sent by jdpiClient.
    const active = await super.canActivate(context);

    if (!active) return false;

    if (isObservable(active)) {
      return lastValueFrom(active);
    } else {
      return active;
    }
  }
}
