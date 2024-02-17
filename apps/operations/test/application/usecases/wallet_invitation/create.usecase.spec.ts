import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  CreateWalletInvitationUseCase as UseCase,
  NotificationService,
  UserService,
  WalletNotActiveException,
  WalletNotFoundException,
  WalletUserNotRootException,
} from '@zro/operations/application';
import {
  WalletEntity,
  WalletInvitationEntity,
  WalletInvitationRepository,
  WalletInvitationState,
  WalletRepository,
  WalletState,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  WalletFactory,
  WalletInvitationFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('CreateWalletInvitationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const expiredInviteH = 5;
  const emailInviteTag = 'OPERATION_EMAIL_INVITE_WALLET';
  const emailInviteUrl = 'localhost';
  const emailInviteFrom = 'teste@zro.com.br';

  const mockRepository = () => {
    const walletInvitationRepository: WalletInvitationRepository =
      createMock<WalletInvitationRepository>();
    const mockGetByIdRepository: jest.Mock = On(walletInvitationRepository).get(
      method((mock) => mock.getById),
    );
    const mockCreateRepository: jest.Mock = On(walletInvitationRepository).get(
      method((mock) => mock.create),
    );
    const mockGetEmailAndWalletRepository: jest.Mock = On(
      walletInvitationRepository,
    ).get(method((mock) => mock.getByEmailAndWalletAndStateIn));

    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetByUuidRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );

    return {
      walletInvitationRepository,
      walletRepository,
      mockGetByIdRepository,
      mockCreateRepository,
      mockGetByUuidRepository,
      mockGetEmailAndWalletRepository,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();

    const mockGetUserByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );

    const notificationService: NotificationService =
      createMock<NotificationService>();

    const mockSendNotificationService: jest.Mock = On(notificationService).get(
      method((mock) => mock.sendEmailWalletInvitation),
    );

    return {
      userService,
      notificationService,
      mockGetUserByUuidService,
      mockSendNotificationService,
    };
  };

  const makeSut = () => {
    const {
      walletInvitationRepository,
      walletRepository,
      mockGetByIdRepository,
      mockCreateRepository,
      mockGetByUuidRepository,
      mockGetEmailAndWalletRepository,
    } = mockRepository();

    const ROOT = 'ROOT';

    const {
      userService,
      notificationService,
      mockGetUserByUuidService,
      mockSendNotificationService,
    } = mockService();

    const sut = new UseCase(
      logger,
      walletInvitationRepository,
      walletRepository,
      userService,
      notificationService,
      expiredInviteH,
      emailInviteTag,
      emailInviteUrl,
      emailInviteFrom,
      ROOT,
    );

    return {
      sut,
      mockGetByIdRepository,
      mockCreateRepository,
      mockGetByUuidRepository,
      mockGetUserByUuidService,
      mockGetEmailAndWalletRepository,
      mockSendNotificationService,
    };
  };

  describe('With invalid  parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockGetByUuidRepository,
        mockCreateRepository,
        mockGetUserByUuidService,
        mockSendNotificationService,
      } = makeSut();

      const tests = [
        () => sut.execute(null, null, null, null, null),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            faker.datatype.string(),
            new WalletEntity({}),
            new UserEntity({}),
            null,
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockSendNotificationService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if wallet invitation already exists', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockGetByUuidRepository,
        mockCreateRepository,
        mockGetUserByUuidService,
        mockSendNotificationService,
      } = makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
        );

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const { id, email, wallet, user, permissionTypes } = walletInvitation;

      const result = await sut.execute(
        id,
        email,
        wallet,
        user,
        permissionTypes,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockSendNotificationService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if wallet not found', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockGetByUuidRepository,
        mockCreateRepository,
        mockGetUserByUuidService,
        mockSendNotificationService,
      } = makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
        );

      mockGetByIdRepository.mockResolvedValue(null);
      mockGetByUuidRepository.mockResolvedValue(null);

      const { id, email, wallet, user, permissionTypes } = walletInvitation;

      const test = () => sut.execute(id, email, wallet, user, permissionTypes);

      await expect(test).rejects.toThrow(WalletNotFoundException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockSendNotificationService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if wallet is not active', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockGetByUuidRepository,
        mockCreateRepository,
        mockGetUserByUuidService,
        mockSendNotificationService,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.DEACTIVATE },
      );

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { wallet },
        );

      mockGetByIdRepository.mockResolvedValue(null);
      mockGetByUuidRepository.mockResolvedValue(wallet);

      const { id, email, user, permissionTypes } = walletInvitation;

      const test = () => sut.execute(id, email, wallet, user, permissionTypes);

      await expect(test).rejects.toThrow(WalletNotActiveException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockSendNotificationService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if wallet users not is root', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockGetByUuidRepository,
        mockCreateRepository,
        mockGetUserByUuidService,
        mockSendNotificationService,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { wallet },
        );

      mockGetByIdRepository.mockResolvedValue(null);
      mockGetByUuidRepository.mockResolvedValue(wallet);

      const { id, email, user, permissionTypes } = walletInvitation;

      const test = () => sut.execute(id, email, wallet, user, permissionTypes);

      await expect(test).rejects.toThrow(WalletUserNotRootException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockSendNotificationService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create successfully', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockGetByUuidRepository,
        mockCreateRepository,
        mockSendNotificationService,
        mockGetUserByUuidService,
        mockGetEmailAndWalletRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE, user },
      );

      const email = 'teste@zro.com.br';

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { email, wallet, user },
        );

      mockGetByIdRepository.mockResolvedValue(null);
      mockGetByUuidRepository.mockResolvedValue(wallet);
      mockGetEmailAndWalletRepository.mockResolvedValue(null);
      mockGetUserByUuidService.mockResolvedValue(user);

      const { id, permissionTypes } = walletInvitation;

      const result = await sut.execute(
        id,
        email,
        wallet,
        user,
        permissionTypes,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user).toBe(user);
      expect(result.wallet).toBe(wallet);
      expect(result.email).toBe(email);
      expect(result.state).toBe(WalletInvitationState.PENDING);
      expect(result.permissionTypes).toHaveLength(permissionTypes.length);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockGetByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockSendNotificationService).toHaveBeenCalledTimes(1);
    });
  });
});
