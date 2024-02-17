import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingAccountEntity,
  AdminBankingAccountRepository,
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  ConfirmAdminBankingTedUseCase as UseCase,
  AdminBankingTedEventEmitter,
  AdminBankingTedInvalidStateException,
  AdminBankingTedNotFoundException,
  AdminBankingAccountNotActiveException,
} from '@zro/banking/application';
import {
  AdminBankingAccountFactory,
  AdminBankingTedFactory,
} from '@zro/test/banking/config';

describe('ConfirmAdminBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      AdminbankingTedRepository,
      mockUpdateAdminBankingTedRepository,
      mockGetAdminBankingTedByTransactionIdRepository,
      AdminBankingAccountRepository,
      mockGetAdminBankingAccountByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockConfirmedEventEmitter } = mockEmitter();

    const sut = new UseCase(
      logger,
      AdminbankingTedRepository,
      AdminBankingAccountRepository,
      eventEmitter,
    );

    return {
      sut,
      mockUpdateAdminBankingTedRepository,
      mockGetAdminBankingTedByTransactionIdRepository,
      mockGetAdminBankingAccountByIdRepository,
      mockConfirmedEventEmitter,
    };
  };

  const mockRepository = () => {
    const AdminbankingTedRepository: AdminBankingTedRepository =
      createMock<AdminBankingTedRepository>();
    const mockGetAdminBankingTedByTransactionIdRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.getByTransactionId));
    const mockUpdateAdminBankingTedRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.update));

    const AdminBankingAccountRepository: AdminBankingAccountRepository =
      createMock<AdminBankingAccountRepository>();
    const mockGetAdminBankingAccountByIdRepository: jest.Mock = On(
      AdminBankingAccountRepository,
    ).get(method((mock) => mock.getById));

    return {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByTransactionIdRepository,
      mockUpdateAdminBankingTedRepository,
      AdminBankingAccountRepository,
      mockGetAdminBankingAccountByIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: AdminBankingTedEventEmitter =
      createMock<AdminBankingTedEventEmitter>();
    const mockConfirmedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.confirmedAdminBankingTed),
    );

    return {
      eventEmitter,
      mockConfirmedEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle confirmed when missing params', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not handle confirmed when adminBankingTed not found', async () => {
      const {
        sut,
        mockGetAdminBankingTedByTransactionIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      const destination =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: true,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            destination,
          },
        );

      mockGetAdminBankingTedByTransactionIdRepository.mockResolvedValueOnce(
        undefined,
      );

      const testScript = () => sut.execute(adminBankingTed);

      await expect(testScript).rejects.toThrow(
        AdminBankingTedNotFoundException,
      );

      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledWith(adminBankingTed.transactionId);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle confirmed when status is not waiting', async () => {
      const {
        sut,
        mockGetAdminBankingTedByTransactionIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      const destination =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: true,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          { state: AdminBankingTedState.FORWARDED, destination },
        );

      mockGetAdminBankingTedByTransactionIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );

      const testScript = () => sut.execute(adminBankingTed);

      await expect(testScript).rejects.toThrow(
        AdminBankingTedInvalidStateException,
      );

      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledWith(adminBankingTed.transactionId);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not handle confirmed if admin account is not active', async () => {
      const {
        sut,
        mockGetAdminBankingTedByTransactionIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      const destination =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: false,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          { state: AdminBankingTedState.WAITING, destination },
        );

      mockGetAdminBankingTedByTransactionIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );

      const testScript = () => sut.execute(adminBankingTed);

      await expect(testScript).rejects.toThrow(
        AdminBankingAccountNotActiveException,
      );

      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledWith(adminBankingTed.transactionId);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should handle confirmed adminBankingTed', async () => {
      const {
        sut,
        mockGetAdminBankingTedByTransactionIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      const destination =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: true,
            accountDigit: '',
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          { state: AdminBankingTedState.WAITING, destination },
        );

      mockGetAdminBankingTedByTransactionIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(
        destination,
      );

      const result = await sut.execute(adminBankingTed);

      expect(result).toBeDefined();
      expect(result.state).toBe(AdminBankingTedState.CONFIRMED);
      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledWith(adminBankingTed.transactionId);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(1);
    });
  });
});
