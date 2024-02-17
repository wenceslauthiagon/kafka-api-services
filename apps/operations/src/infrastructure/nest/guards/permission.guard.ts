import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { HAS_PERMISSION_ACTION, IS_PUBLIC_KEY } from '@zro/common';
import { PermissionAction, WalletGuardRequest } from '@zro/operations/domain';
import { PermissionActionNotFoundException } from '@zro/operations/application';

/**
 * Grant access to endpoints if user has permission.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: Logger,
  ) {
    this.logger = logger.child({ context: PermissionGuard.name });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if requested controller or handler is public.
    // Controller or handler decorated with @Public are skipped from Permission validation.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Is controller or handler public?
    if (isPublic) {
      // Yes! Left protection to be specified by controler or handler.
      return true;
    }

    // Get request.
    const request: WalletGuardRequest = context.switchToHttp().getRequest();

    const requestId = request?.id ?? uuidV4();
    const logger = this.logger.child({ loggerId: requestId });
    const { user, wallet } = request;

    logger.debug('User and wallet found.', { user, wallet });

    if (!user || !wallet?.id || !wallet?.user?.uuid) {
      logger.warn('Missing user or wallet.');
      return false;
    }

    // Check if user is the wallet owner (root).
    const userIsRoot = user.uuid === wallet.user.uuid;
    if (userIsRoot) {
      // Yes! Root user can access everything.
      return true;
    }

    if (!wallet?.permissions || !Object.keys(wallet.permissions).length) {
      logger.warn('Missing wallet permissions.', {
        permissions: wallet?.permissions,
      });
      return false;
    }

    // Check if requested controller or handler has permission action.
    // Controller or handler decorated with @HasPermission fails if
    // user logged has no this permission action.
    const permissionActionTag = this.reflector.getAllAndOverride<
      PermissionAction['tag']
    >(HAS_PERMISSION_ACTION, [context.getHandler(), context.getClass()]);

    if (!permissionActionTag) {
      logger.debug('Missing permission action.', { permissionActionTag });
      throw new PermissionActionNotFoundException(permissionActionTag);
    }

    return wallet.permissions[permissionActionTag];
  }
}
