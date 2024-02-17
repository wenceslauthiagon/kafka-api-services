import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  CancelWalletInvitationUseCase as UseCase,
  WalletInvitationInvalidStateException,
  WalletInvitationIsExpiredException,
  WalletInvitationNotFoundException,
} from '@zro/operations/application';
import {
  WalletInvitationEntity,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import { WalletInvitationFactory } from '@zro/test/operations/config';

describe('CancelWalletInvitationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const walletInvitationRepository: WalletInvitationRepository =
      createMock<WalletInvitationRepository>();
    const mockGetByIdAndUserRepository: jest.Mock = On(
      walletInvitationRepository,
    ).get(method((mock) => mock.getByIdAndUser));
    const mockUpdateRepository: jest.Mock = On(walletInvitationRepository).get(
      method((mock) => mock.update),
    );

    return {
      walletInvitationRepository,
      mockGetByIdAndUserRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const {
      walletInvitationRepository,
      mockUpdateRepository,
      mockGetByIdAndUserRepository,
    } = mockRepository();

    const sut = new UseCase(logger, walletInvitationRepository);

    return {
      sut,
      mockGetByIdAndUserRepository,
      mockUpdateRepository,
    };
  };

  describe('With invalid  parameters', () => {
    it('TC0001 - Should not cancel if missing params', async () => {
      const { sut, mockGetByIdAndUserRepository, mockUpdateRepository } =
        makeSut();

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(faker.datatype.uuid(), null),
        () => sut.execute(null, new UserEntity({})),
        () => sut.execute(faker.datatype.uuid(), new UserEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not cancel if wallet invitation not found', async () => {
      const { sut, mockGetByIdAndUserRepository, mockUpdateRepository } =
        makeSut();

      mockGetByIdAndUserRepository.mockResolvedValue(null);

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
        );

      const { id, user } = walletInvitation;

      const test = () => sut.execute(id, user);

      await expect(test).rejects.toThrow(WalletInvitationNotFoundException);
      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdAndUserRepository).toHaveBeenCalledWith(id, user);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not cancel if wallet invitation is already canceled', async () => {
      const { sut, mockGetByIdAndUserRepository, mockUpdateRepository } =
        makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { state: WalletInvitationState.CANCELED },
        );

      const { id, user } = walletInvitation;

      mockGetByIdAndUserRepository.mockResolvedValue(walletInvitation);

      const result = await sut.execute(id, user);

      expect(result).toBeDefined();
      expect(result.state).toBe(WalletInvitationState.CANCELED);
      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdAndUserRepository).toHaveBeenCalledWith(id, user);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not cancel if wallet invitation state is invalid', async () => {
      const { sut, mockGetByIdAndUserRepository, mockUpdateRepository } =
        makeSut();

      const INVALID_STATES = [
        WalletInvitationState.DECLINED,
        WalletInvitationState.ACCEPTED,
      ];

      for (const state of INVALID_STATES) {
        const walletInvitation =
          await WalletInvitationFactory.create<WalletInvitationEntity>(
            WalletInvitationEntity.name,
            { state },
          );

        const { id, user } = walletInvitation;

        mockGetByIdAndUserRepository.mockResolvedValue(walletInvitation);

        const test = () => sut.execute(id, user);

        await expect(test).rejects.toThrow(
          WalletInvitationInvalidStateException,
        );

        expect(mockGetByIdAndUserRepository).toHaveBeenCalledWith(id, user);
      }

      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(
        INVALID_STATES.length,
      );
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not cancel if wallet invitation is expired', async () => {
      const { sut, mockGetByIdAndUserRepository, mockUpdateRepository } =
        makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          {
            state: WalletInvitationState.PENDING,
            expiredAt: faker.date.past(),
          },
        );

      const { id, user } = walletInvitation;

      mockGetByIdAndUserRepository.mockResolvedValue(walletInvitation);

      const test = () => sut.execute(id, user);

      await expect(test).rejects.toThrow(WalletInvitationIsExpiredException);
      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdAndUserRepository).toHaveBeenCalledWith(id, user);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should cancel with valid parameters', async () => {
      const { sut, mockGetByIdAndUserRepository, mockUpdateRepository } =
        makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { state: WalletInvitationState.PENDING },
        );

      mockGetByIdAndUserRepository.mockResolvedValue(walletInvitation);

      const { id, user } = walletInvitation;

      const result = await sut.execute(id, user);

      expect(result).toBeDefined();
      expect(result.state).toBe(WalletInvitationState.CANCELED);
      expect(result.permissionTypes).toHaveLength(
        walletInvitation.permissionTypes.length,
      );
      expect(mockGetByIdAndUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdAndUserRepository).toHaveBeenCalledWith(id, user);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });
  });
});
