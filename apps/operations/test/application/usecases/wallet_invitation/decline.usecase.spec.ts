import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  DeclineWalletInvitationUseCase as UseCase,
  WalletInvitationInvalidStateException,
  WalletInvitationIsExpiredException,
  WalletInvitationNotFoundException,
  WalletInvitationNotPermittedException,
} from '@zro/operations/application';
import {
  WalletInvitationEntity,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import { WalletInvitationFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('DeclineWalletInvitationUseCase', () => {
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

    return {
      walletInvitationRepository,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const {
      walletInvitationRepository,
      mockUpdateRepository,
      mockGetByIdRepository,
    } = mockRepository();

    const sut = new UseCase(logger, walletInvitationRepository);

    return {
      sut,
      mockGetByIdRepository,
      mockUpdateRepository,
    };
  };

  describe('With invalid  parameters', () => {
    it('TC0001 - Should not decline if missing params', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(null, new UserEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not decline if wallet invitation not found', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      mockGetByIdRepository.mockResolvedValue(null);

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
        );

      const { id, user } = walletInvitation;

      const test = () => sut.execute(id, user);

      await expect(test).rejects.toThrow(WalletInvitationNotFoundException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not decline if wallet invitation is already declined', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { state: WalletInvitationState.DECLINED },
        );

      const { id, user } = walletInvitation;

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const result = await sut.execute(id, user);

      expect(result).toBeDefined();
      expect(result.state).toBe(WalletInvitationState.DECLINED);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not decline if wallet invitation state is invalid', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      const INVALID_STATES = [
        WalletInvitationState.CANCELED,
        WalletInvitationState.ACCEPTED,
      ];

      for (const state of INVALID_STATES) {
        const walletInvitation =
          await WalletInvitationFactory.create<WalletInvitationEntity>(
            WalletInvitationEntity.name,
            { state },
          );

        const { id, user } = walletInvitation;

        mockGetByIdRepository.mockResolvedValue(walletInvitation);

        const test = () => sut.execute(id, user);

        await expect(test).rejects.toThrow(
          WalletInvitationInvalidStateException,
        );

        expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      }

      expect(mockGetByIdRepository).toHaveBeenCalledTimes(
        INVALID_STATES.length,
      );
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not decline if wallet invitation is expired', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          {
            state: WalletInvitationState.PENDING,
            expiredAt: faker.date.past(),
          },
        );

      const { id, user } = walletInvitation;

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const test = () => sut.execute(id, user);

      await expect(test).rejects.toThrow(WalletInvitationIsExpiredException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not accept if wallet invitation not has user informations', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          {
            state: WalletInvitationState.PENDING,
          },
        );

      mockGetByIdRepository.mockResolvedValue(walletInvitation);

      const { id, user } = walletInvitation;

      const test = () => sut.execute(id, user);

      await expect(test).rejects.toThrow(WalletInvitationNotPermittedException);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should decline with valid parameters', async () => {
      const { sut, mockGetByIdRepository, mockUpdateRepository } = makeSut();

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

      const result = await sut.execute(id, user);

      expect(result).toBeDefined();
      expect(result.state).toBe(WalletInvitationState.DECLINED);
      expect(result.permissionTypes).toHaveLength(1);
      expect(mockGetByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });
  });
});
