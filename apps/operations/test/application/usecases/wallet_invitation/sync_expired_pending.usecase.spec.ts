import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  WalletInvitationEntity,
  WalletInvitationRepository,
} from '@zro/operations/domain';
import { SyncPendingExpiredWalletInvitationUseCase as UseCase } from '@zro/operations/application';
import { WalletInvitationFactory } from '@zro/test/operations/config';

describe('SyncPendingExpiredWalletInvitationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const walletInvitationRepository: WalletInvitationRepository =
      createMock<WalletInvitationRepository>();
    const mockGetByExpiredAtLessThanAndStateInRepository: jest.Mock = On(
      walletInvitationRepository,
    ).get(method((mock) => mock.getByExpiredAtLessThanAndStateIn));
    const mockUpdateRepository: jest.Mock = On(walletInvitationRepository).get(
      method((mock) => mock.update),
    );

    return {
      walletInvitationRepository,
      mockGetByExpiredAtLessThanAndStateInRepository,
      mockUpdateRepository,
    };
  };

  const makeSut = () => {
    const {
      walletInvitationRepository,
      mockGetByExpiredAtLessThanAndStateInRepository,
      mockUpdateRepository,
    } = mockRepository();

    const sut = new UseCase(logger, walletInvitationRepository);

    return {
      sut,
      mockGetByExpiredAtLessThanAndStateInRepository,
      mockUpdateRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should sync pending expires wallet successfully', async () => {
      const {
        sut,
        mockGetByExpiredAtLessThanAndStateInRepository,
        mockUpdateRepository,
      } = makeSut();

      const walletInvitation =
        await WalletInvitationFactory.create<WalletInvitationEntity>(
          WalletInvitationEntity.name,
        );

      mockGetByExpiredAtLessThanAndStateInRepository.mockResolvedValueOnce([
        walletInvitation,
      ]);

      await sut.execute();

      expect(
        mockGetByExpiredAtLessThanAndStateInRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });
  });
});
