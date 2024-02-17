import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@zro/common';

/**
 * Grant access to endpoints if user sent the api-key in header.
 */
@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
  /**
   * Default guard constructor that calls AuthGuard constructor.
   * @param reflector Access to class or method modifiers.
   */
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Custom JWT guard implementation. Allow some controller or handlers to be
   * exposed to internet without JWT protection.
   * @param context Request context.
   * @returns
   */
  canActivate(context: ExecutionContext) {
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

    // No! Controller or handler are protected, so check JWT sent by user.
    return super.canActivate(context);
  }
}
