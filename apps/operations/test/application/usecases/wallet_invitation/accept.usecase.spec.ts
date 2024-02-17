import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  AcceptWalletInvitationUseCase as UseCase,
  WalletInvitationInvalidCodeConfirmException,
  WalletInvitationInvalidStateException,
  WalletInvitationIsExpiredException,
  WalletInvitationNotFoundException,
  WalletInvitationNotPermittedException,
} from '@zro/operations/application';
import {
  UserWalletRepository,
  WalletInvitationEntity,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import { WalletInvitationFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('AcceptWalletInvitationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const walletInvitationRepository: WalletInvitationRepository =
      createMock<WalletInvitationRepository>();
    const mockGetByIdRepository: jest.Mock = On(walletInvitationRepository).get(
      method((mock) => mock.getById),
    );
    const mockUpdateRepository: jest.Mock = On(walletInvitationRepository).get(
      method((mock) => mock.update),
    );

    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockCreateRepository: jest.Mock = On(userWalletRepository).get(
      method((mock) => mock.create),
    );
    const mockGetRepository: jest.Mock = On(userWalletRepository).get(
      method((mock) => mock.getByUserAndWallet),
    );

    return {
      walletInvitationRepository,
      userWalletRepository,
      mockGetByIdRepository,
      mockUpdateRepository,
      mockCreateRepository,
      mockGetRepository,
    };
  };

  const makeSut = () => {
    const {
      walletInvitationRepository,
      userWalletRepository,
      mockGetByIdRepository,
      mockUpdateRepository,
      mockCreateRepository,
      mockGetRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      walletInvitationRepository,
      userWalletRepository,
    );

    return {
      sut,
      mockGetByIdRepository,
      mockUpdateRepository,
      mockCreateRepository,
      mockGetRepository,
    };
  };

  describe('With invalid  parameters', () => {
    it('TC0001 - Should not accept if missing params', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockCreateRepository,
      } = makeSut();

      const tests = [
        () => sut.execute(null, null, null),
        () => sut.execute(faker.datatype.uuid(), null, null),
        () => sut.execute(null, faker.datatype.string(5), null),
        () => sut.execute(null, null, new UserEntity({})),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            faker.datatype.string(5),
            new UserEntity({}),
          ),
        () =>
          sut.execute(
            null,
            faker.datatype.string(5),
            new UserEntity({ uuid: faker.datatype.uuid() }),
          ),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not accept if wallet invitation not found', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockCreateRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValue(null);

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
        );

      const { id, confirmCode, user } = walletInvitation;

      const test = () => sut.execute(id, confirmCode, user);

      await expect(test).rejects.toThrow(WalletInvitationNotFoundException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not accept if wallet invitation is already accepted', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockCreateRepository,
      } = makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { state: WalletInvitationState.ACCEPTED },
        );

      const { id, confirmCode, user } = walletInvitation;

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const result = await sut.execute(id, confirmCode, user);

      expect(result).toBeDefined();
      expect(result.state).toBe(WalletInvitationState.ACCEPTED);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not accept if wallet invitation state is invalid', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockCreateRepository,
      } = makeSut();

      const INVALID_STATES = [
        WalletInvitationState.CANCELED,
        WalletInvitationState.DECLINED,
      ];

      for (const state of INVALID_STATES) {
        const walletInvitation =
          await WalletInvitationFactory.create<WalletInvitationEntity>(
            WalletInvitationEntity.name,
            { state },
          );

        const { id, confirmCode, user } = walletInvitation;

        mockGetByIdRepository.mockResolvedValue(walletInvitation);

        const test = () => sut.execute(id, confirmCode, user);

        await expect(test).rejects.toThrow(
          WalletInvitationInvalidStateException,
        );

        expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      }

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(
        INVALID_STATES.length,
      );
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not accept if wallet invitation is expired', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockCreateRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValue(null);

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          {
            state: WalletInvitationState.PENDING,
            expiredAt: faker.date.past(),
          },
        );

      const { id, confirmCode, user } = walletInvitation;

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const test = () => sut.execute(id, confirmCode, user);

      await expect(test).rejects.toThrow(WalletInvitationIsExpiredException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not accept if wallet invitation not has user informations', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockCreateRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValue(null);

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { state: WalletInvitationState.PENDING },
        );

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const { id, confirmCode, user } = walletInvitation;

      const test = () => sut.execute(id, confirmCode, user);

      await expect(test).rejects.toThrow(WalletInvitationNotPermittedException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not accept if confirmation code dont match', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockCreateRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValue(null);

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          {
            user,
            email: user.email,
            state: WalletInvitationState.PENDING,
          },
        );

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const { id } = walletInvitation;

      const test = () => sut.execute(id, faker.datatype.string(5), user);

      await expect(test).rejects.toThrow(
        WalletInvitationInvalidCodeConfirmException,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0008 - Should accept with valid parameters', async () => {
      const {
        sut,
        mockGetByIdRepository,
        mockUpdateRepository,
        mockCreateRepository,
        mockGetRepository,
      } = makeSut();

      mockGetByIdRepository.mockResolvedValue(null);
      mockGetRepository.mockResolvedValue(null);

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          {
            user,
            email: user.email,
            state: WalletInvitationState.PENDING,
          },
        );

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const { id, confirmCode } = walletInvitation;

      const result = await sut.execute(id, confirmCode, user);

      expect(result).toBeDefined();
      expect(result.state).toBe(WalletInvitationState.ACCEPTED);
      expect(result.permissionTypes).toHaveLength(
        walletInvitation.permissionTypes.length,
      );
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
    });
  });
});
