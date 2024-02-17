import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  WalletInvitationState,
  WalletInvitationEntity,
  WalletInvitationRepository,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import { GetAllWalletInvitationByUserUseCase as UseCase } from '@zro/operations/application';
import { WalletInvitationFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('GetAllWalletInvitationByUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const walletInvitationRepository: WalletInvitationRepository =
      createMock<WalletInvitationRepository>();
    const mockGetByUserAndFilterRepository: jest.Mock = On(
      walletInvitationRepository,
    ).get(method((mock) => mock.getByUserAndFilter));

    return {
      walletInvitationRepository,
      mockGetByUserAndFilterRepository,
    };
  };

  const makeSut = () => {
    const { walletInvitationRepository, mockGetByUserAndFilterRepository } =
      mockRepository();

    const sut = new UseCase(logger, walletInvitationRepository);

    return {
      sut,
      mockGetByUserAndFilterRepository,
    };
  };

  describe('With valid  parameters', () => {
    it('TC0001 - Should get all wallet invitation by user successfully', async () => {
      const { sut, mockGetByUserAndFilterRepository } = makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
          { state: WalletInvitationState.PENDING },
        );

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetByUserAndFilterRepository.mockResolvedValueOnce([
        walletInvitation,
      ]);

      const result = await sut.execute(null, null, user);

      expect(mockGetByUserAndFilterRepository).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get all wallet invitation if missing params', async () => {
      const { sut, mockGetByUserAndFilterRepository } = makeSut();

      const tests = [
        () => sut.execute(null, null, null),
        () => sut.execute(null, null, new UserEntity({})),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByUserAndFilterRepository).toHaveBeenCalledTimes(0);
    });
  });
});
