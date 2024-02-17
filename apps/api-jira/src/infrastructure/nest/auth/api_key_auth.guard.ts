import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  ProtocolType,
  NotImplementedException,
  IS_PUBLIC_KEY,
} from '@zro/common';

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

    let request: any = null;

    const protocol = context.getType();
    if (protocol !== ProtocolType.HTTP) {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    const ctx = context.switchToHttp();
    request = ctx.getRequest();

    // Get api-key from request query and set it in the request header
    if (request.query['api-key'] && !request.header('x-api-key')) {
      (request.headers['x-api-key'] as any) = request.query['api-key'];
    }

    return super.canActivate(context);
  }
}
