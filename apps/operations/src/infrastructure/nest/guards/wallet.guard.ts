import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Cache, Milliseconds } from 'cache-manager';
import { isUUID } from 'class-validator';
import {
  KafkaService,
  MissingEnvVarException,
  ValidationException,
  IS_PUBLIC_KEY,
} from '@zro/common';
import {
  AuthWallet,
  PermissionType,
  WalletGuardRequest,
} from '@zro/operations/domain';
import { AuthUser, UserEntity } from '@zro/users/domain';
import {
  GetUserByUuidResponse,
  GetUserByUuidRequest,
  GetOnboardingByUserAndStatusIsFinishedRequest,
  GetOnboardingByUserAndStatusIsFinishedResponse,
} from '@zro/users/interface';
import {
  GetOnboardingByUserAndStatusIsFinishedServiceKafka,
  GetUserByUuidServiceKafka,
} from '@zro/users/infrastructure';
import {
  GetAllPermissionActionByPermissionTypesRequest,
  GetAllUserWalletByUserRequest,
  GetAllUserWalletByUserResponse,
  GetWalletAccountByWalletAndCurrencyRequest,
  GetWalletAccountByWalletAndCurrencyResponse,
} from '@zro/operations/interface';
import {
  NOT_LOAD_AUTH_WALLET_KEY,
  GetAllUserWalletByUserServiceKafka,
  GetWalletAccountByWalletAndCurrencyServiceKafka,
  GetAllPermissionActionByPermissionTypesServiceKafka,
} from '@zro/operations/infrastructure';

interface WalletConfig {
  APP_JWT_CACHE_TTL_S: string;
  APP_OPERATION_CURRENCY_TAG: string;
}

/**
 * Guards Wallet and send it to controller.
 */
@Injectable()
export class WalletGuard implements CanActivate {
  private readonly ttl: Milliseconds;
  private readonly currencyTag: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly kafkaService: KafkaService,
    readonly configService: ConfigService<WalletConfig>,
    private readonly cache: Cache,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: WalletGuard.name });
    this.ttl = configService.get<number>('APP_JWT_CACHE_TTL_S', 900) * 1000;
    this.currencyTag = configService.get<string>('APP_OPERATION_CURRENCY_TAG');

    if (!this.currencyTag) {
      throw new MissingEnvVarException(['APP_OPERATION_CURRENCY_TAG']);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if requested controller or handler is public.
    // Controller or handler decorated with @Public are skipped from Wallet validation.
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

    if (!request.user) {
      return false;
    }

    // Check if requested controller or handler doesn't need AuthWallet data.
    // Controller or handler decorated with @NotLoadAuthWallet are skipped from AuthWallet loading.
    const dontLoadAuthWallet = this.reflector.getAllAndOverride<boolean>(
      NOT_LOAD_AUTH_WALLET_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Does controller or handler not need to load AuthWallet data?
    if (dontLoadAuthWallet) {
      // Yes! Dont load AuthWallet to be specified by controler or handler.
      return true;
    }

    const requestId = request?.id ?? uuidV4();
    this.logger = this.logger.child({ loggerId: requestId });
    const { user, headers } = request;

    const headerWalletUuid = headers['x-wallet-uuid'];
    if (headerWalletUuid && !isUUID(headerWalletUuid, 4)) {
      throw new ValidationException([
        {
          value: headerWalletUuid,
          property: 'x-wallet-uuid',
          constraints: { IS_UUID: 'IS_UUID' },
        },
      ]);
    }

    const walletUuid = headerWalletUuid || 'DEFAULT_WALLET';

    // Check if a previous wallet exists.
    const walletCache: string = await this.cache.get(
      `User:${user.uuid}:Wallet:${walletUuid}`,
    );

    if (walletCache) {
      request.wallet = JSON.parse(walletCache);
      return true;
    }

    const userWallets = await this.getAllUserWalletByUser(requestId, user);

    let userWallet: GetAllUserWalletByUserResponse = null;

    if (headerWalletUuid) {
      // Get wallet from header?
      userWallet = userWallets.find(
        (userWallet) => userWallet.wallet.uuid === headerWalletUuid,
      );
    } else {
      // No, get default one.
      userWallet = userWallets.find((userWallet) => userWallet.wallet.default);
    }

    // Check if some wallet uuid is the wallet default or sent in header.
    if (!userWallet) {
      this.logger.warn('UserWallet not found.', { userWallet });
      return false;
    }

    const walletFound = userWallet.wallet;

    const walletOwnerFound = await this.getUserByUuid(
      requestId,
      walletFound.userId,
    );

    if (!walletOwnerFound) {
      this.logger.warn('Wallet owner user not found.', { walletFound });
      return false;
    }

    // If user is the wallet owner (root).
    const userIsRoot = user.uuid === walletOwnerFound.uuid;

    const [onboardingFound, walletAccountFound, permissionsFound] =
      await Promise.all([
        this.getOnboardingByUser(requestId, walletOwnerFound.uuid),
        this.getWalletAccountByWallet(requestId, walletFound.uuid),
        // Root user can access everything, so don't need to get them.
        userIsRoot
          ? {}
          : this.getAllActionByPermissionTypes(
              requestId,
              userWallet.permissionTypeTags,
            ),
      ]);

    const authWallet: AuthWallet = {
      id: walletFound.uuid,
      state: walletFound.state,
      user: new UserEntity({
        id: walletOwnerFound.id,
        uuid: walletOwnerFound.uuid,
        active: walletOwnerFound.active,
      }),
      permissions: permissionsFound,
      onboarding: {
        general: {
          status: onboardingFound?.status,
          createdAt: onboardingFound?.createdAt,
          updatedAt: onboardingFound?.updatedAt,
        },
        banking: {
          status: onboardingFound?.status,
          branch: onboardingFound?.branch,
          accountNumber: onboardingFound?.accountNumber,
          createdAt: onboardingFound?.createdAt,
          updatedAt: onboardingFound?.updatedAt,
        },
        crypto: {
          status: onboardingFound?.status,
          createdAt: onboardingFound?.createdAt,
          updatedAt: onboardingFound?.updatedAt,
        },
        debitCard: {
          status: onboardingFound?.status,
          accountNumber: walletAccountFound?.accountNumber,
          branchNumber: walletAccountFound?.branchNumber,
          accountId: walletAccountFound?.accountId,
          createdAt: onboardingFound?.createdAt,
          updatedAt: onboardingFound?.updatedAt,
        },
      },
    };

    await this.cache.set(
      `User:${user.uuid}:Wallet:${walletUuid}`,
      JSON.stringify(authWallet),
      this.ttl,
    );

    request.wallet = authWallet;

    return true;
  }

  private async getUserByUuid(
    requestId: string,
    uuid: string,
  ): Promise<GetUserByUuidResponse> {
    // Create a request.
    const request = new GetUserByUuidRequest({ uuid });

    const getUserByUuidService = new GetUserByUuidServiceKafka(
      requestId,
      this.logger,
      this.kafkaService,
    );

    // Send request to user service.
    const user = await getUserByUuidService.execute(request);

    this.logger.debug('User found.');

    return user;
  }

  // FIXME: This call will happen for all onboardings and not just for finished onboardings
  private async getOnboardingByUser(
    requestId: string,
    userId: string,
  ): Promise<GetOnboardingByUserAndStatusIsFinishedResponse> {
    // Create a request.
    const request = new GetOnboardingByUserAndStatusIsFinishedRequest({
      userId,
    });

    const getOnboardingByUserAndStatusIsFinishedService =
      new GetOnboardingByUserAndStatusIsFinishedServiceKafka(
        requestId,
        this.logger,
        this.kafkaService,
      );

    // Send request to user service.
    const onboarding =
      await getOnboardingByUserAndStatusIsFinishedService.execute(request);

    if (onboarding) {
      this.logger.debug('Onboarding found.');
    } else {
      this.logger.debug('Onboarding not found.');
    }

    return onboarding;
  }

  private async getWalletAccountByWallet(
    requestId: string,
    walletId: string,
  ): Promise<GetWalletAccountByWalletAndCurrencyResponse> {
    // Create a request.
    const request = new GetWalletAccountByWalletAndCurrencyRequest({
      walletId,
      currencyTag: this.currencyTag,
    });

    const getWalletAccountByWalletAndCurrencyService =
      new GetWalletAccountByWalletAndCurrencyServiceKafka(
        requestId,
        this.logger,
        this.kafkaService,
      );

    // Send request to operations service.
    const walletAccount =
      await getWalletAccountByWalletAndCurrencyService.execute(request);

    if (walletAccount) {
      this.logger.debug('WalletAccount found.');
    } else {
      this.logger.debug('WalletAccount not found.');
    }

    return walletAccount;
  }

  private async getAllUserWalletByUser(
    requestId: string,
    user: AuthUser,
  ): Promise<GetAllUserWalletByUserResponse[]> {
    // Create a request.
    const request = new GetAllUserWalletByUserRequest({
      userId: user.uuid,
    });

    const getUserWalletByUserService = new GetAllUserWalletByUserServiceKafka(
      requestId,
      this.logger,
      this.kafkaService,
    );

    // Send request to operations service.
    const userWallets = await getUserWalletByUserService.execute(request);

    this.logger.debug('User Wallets found.', {
      userWalletsLength: userWallets.length,
    });

    return userWallets;
  }

  private async getAllActionByPermissionTypes(
    requestId: string,
    permissionTypeTags: PermissionType['tag'][],
  ): Promise<AuthWallet['permissions']> {
    const logger = this.logger;
    const kafkaService = this.kafkaService;

    const permissions: AuthWallet['permissions'] = {};

    const getAllActionIterable = {
      [Symbol.asyncIterator]() {
        return {
          i: 1,
          total: 0,
          async next() {
            // Build get all permissionActions microservice.
            const getAllActionsByPermissionTypesService =
              new GetAllPermissionActionByPermissionTypesServiceKafka(
                requestId,
                logger,
                kafkaService,
              );

            // Get only active permissionActions
            const request = new GetAllPermissionActionByPermissionTypesRequest({
              permissionTypeTags,
              page: this.i++,
              pageSize: 100,
            });

            // Get an page of permissionActions.
            const pagePermissionActions =
              await getAllActionsByPermissionTypesService.execute(request);

            // Remember how many permissionActions were loaded.
            this.total += pagePermissionActions.pageTotal;

            return {
              value: pagePermissionActions,
              done: !pagePermissionActions.data?.length,
            };
          },
        };
      },
    };

    // Iterate over all gotten pages.
    for await (const pageActions of getAllActionIterable) {
      pageActions.data.forEach((item) => (permissions[item.tag] = true));
    }

    this.logger.debug('Permission actions length found.', {
      length: Object.keys(permissions).length,
    });

    return permissions;
  }
}
