import { Logger } from 'winston';
import {
  MissingDataException,
  createRandomNumberCode,
  getMoment,
} from '@zro/common';
import {
  Wallet,
  WalletInvitation,
  WalletInvitationEntity,
  WalletInvitationRepository,
  WalletInvitationState,
  WalletRepository,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  WalletNotFoundException,
  WalletUserNotRootException,
  UserService,
  GetUserByUuidRequest,
  WalletNotActiveException,
  WalletInvitationAlreadyExistsException,
  NotificationService,
} from '@zro/operations/application';

export class CreateWalletInvitationUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletInvitationRepository Wallet invitation repository.
   * @param walletRepository Wallet repository.
   * @param userService User service.
   * @param notificationService Notification Service.
   */
  constructor(
    private logger: Logger,
    private readonly walletInvitationRepository: WalletInvitationRepository,
    private readonly walletRepository: WalletRepository,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly expiredInviteH: number,
    private readonly emailInviteTag: string,
    private readonly emailInviteUrl: string,
    private readonly emailInviteFrom: string,
    private readonly permissionRootTag: string,
  ) {
    this.logger = logger.child({ context: CreateWalletInvitationUseCase.name });
  }

  /**
   * Create wallet invitation.
   * @param email Contact information Email.
   * @param wallet Wallet for invite.
   * @param user User.
   * @param permissionTypes PermissionTypes.
   * @returns Wallet invitation created.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(
    id: WalletInvitation['id'],
    email: WalletInvitation['email'],
    wallet: Wallet,
    user: User,
    permissionTypes: WalletInvitation['permissionTypes'],
  ): Promise<WalletInvitation> {
    // Data input check
    if (
      !id ||
      !wallet?.uuid ||
      !user?.uuid ||
      !email ||
      !permissionTypes?.length
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!user?.uuid ? ['User ID'] : []),
        ...(!email ? ['Contact Information Email'] : []),
        ...(!permissionTypes?.length ? ['Permission Types'] : []),
      ]);
    }

    // Permission ROOT can't be used to update a permission.
    if (permissionTypes.some((i) => i.tag === this.permissionRootTag)) {
      throw new MissingDataException(['Permission Type invalid']);
    }

    // Check indepotent
    const walletInvitation = await this.walletInvitationRepository.getById(id);

    if (walletInvitation) {
      this.logger.debug('Wallet invitation already exists.', {
        walletInvitation,
      });
      return walletInvitation;
    }

    //Check if wallet exists for this user
    const walletFound = await this.walletRepository.getByUuid(wallet.uuid);

    this.logger.debug('Wallet found.', { walletFound });

    if (!walletFound) {
      throw new WalletNotFoundException({ uuid: wallet.uuid });
    }

    if (!walletFound.isActive()) {
      throw new WalletNotActiveException(walletFound);
    }

    if (walletFound.user?.uuid !== user.uuid) {
      throw new WalletUserNotRootException(walletFound);
    }

    // Check if exists other active invite for this contact and wallet
    const walletInvitationExists =
      await this.walletInvitationRepository.getByEmailAndWalletAndStateIn(
        email,
        wallet,
        [WalletInvitationState.ACCEPTED, WalletInvitationState.PENDING],
      );

    this.logger.debug('Check wallet invitation exists found.', {
      walletInvitation: walletInvitationExists,
    });

    if (walletInvitationExists) {
      throw new WalletInvitationAlreadyExistsException({
        email,
        wallet,
      });
    }

    const request: GetUserByUuidRequest = {
      userId: user.uuid,
    };

    const userFound = await this.userService.getUserByUuid(request);

    this.logger.debug('User found.', { user: userFound });

    if (!userFound) {
      throw new UserNotFoundException({ uuid: request.userId });
    }

    const newWalletInvitation = new WalletInvitationEntity({
      id,
      user,
      wallet,
      email,
      permissionTypes,
      state: WalletInvitationState.PENDING,
      confirmCode: createRandomNumberCode(5),
      expiredAt: getMoment().add(this.expiredInviteH, 'h').toDate(),
    });

    await this.walletInvitationRepository.create(newWalletInvitation);

    this.logger.debug('Wallet invitation created.', { newWalletInvitation });

    const userRequest = new UserEntity({ name: userFound.name });

    await this.notificationService.sendEmailWalletInvitation(
      newWalletInvitation,
      userRequest,
      this.emailInviteTag,
      this.emailInviteUrl,
      this.emailInviteFrom,
    );

    return newWalletInvitation;
  }
}
