import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { ForbiddenException } from '@nestjs/common';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { AdminEntity } from '@zro/admin/domain';
import {
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingAccountEntity,
  AdminBankingAccountRepository,
} from '@zro/banking/domain';
import {
  CreateAdminBankingTedUseCase as UseCase,
  AdminBankingTedEventEmitter,
  AdminBankingAccountNotFoundException,
  AdminBankingAccountNotActiveException,
  AdminBankingTedBetweenSameAccountException,
} from '@zro/banking/application';
import {
  AdminBankingAccountFactory,
  AdminBankingTedFactory,
} from '@zro/test/banking/config';
import { AdminFactory } from '@zro/test/admin/config';

describe('CreateAdminBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
      mockCreateAdminBankingTedRepository,
      AdminBankingAccountRepository,
      mockGetAdminBankingAccountByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockPendingAdminBankingTedEventEmitter } =
      mockEmitter();

    const sut = new UseCase(
      logger,
      AdminbankingTedRepository,
      AdminBankingAccountRepository,
      eventEmitter,
    );
    return {
      sut,
      mockGetAdminBankingTedByIdRepository,
      mockCreateAdminBankingTedRepository,
      mockGetAdminBankingAccountByIdRepository,
      mockPendingAdminBankingTedEventEmitter,
    };
  };

  const mockRepository = () => {
    const AdminbankingTedRepository: AdminBankingTedRepository =
      createMock<AdminBankingTedRepository>();
    const mockGetAdminBankingTedByIdRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.getById));
    const mockCreateAdminBankingTedRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.create));

    const AdminBankingAccountRepository: AdminBankingAccountRepository =
      createMock<AdminBankingAccountRepository>();
    const mockGetAdminBankingAccountByIdRepository: jest.Mock = On(
      AdminBankingAccountRepository,
    ).get(method((mock) => mock.getById));

    return {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
      mockCreateAdminBankingTedRepository,
      AdminBankingAccountRepository,
      mockGetAdminBankingAccountByIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: AdminBankingTedEventEmitter =
      createMock<AdminBankingTedEventEmitter>();
    const mockPendingAdminBankingTedEventEmitter: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.pendingAdminBankingTed));

    return {
      eventEmitter,
      mockPendingAdminBankingTedEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should return if admin banking ted exists', async () => {
      const {
        sut,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      const { id, createdByAdmin, destination, source, description, value } =
        adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );
      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        createdByAdmin,
      );

      const result = await sut.execute(
        id,
        createdByAdmin,
        source,
        destination,
        description,
        value,
      );

      expect(id).toBe(result.id);
      expect(source).toBe(result.source);
      expect(destination).toBe(result.destination);
      expect(value).toBe(result.value);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should create successfully', async () => {
      const {
        sut,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const source =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: true,
          },
        );

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
            source,
            destination,
          },
        );

      const { id, createdByAdmin: admin, description, value } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(null);
      mockGetAdminBankingAccountByIdRepository
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(destination);

      const result = await sut.execute(
        id,
        admin,
        source,
        destination,
        description,
        value,
      );

      expect(id).toBe(result.id);
      expect(source).toBe(result.source);
      expect(destination).toBe(result.destination);
      expect(value).toBe(result.value);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(2);
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not handle pending when missing params', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      const {
        id,
        createdByAdmin: admin,
        source,
        destination,
        description,
        value,
      } = adminBankingTed;

      const tests = [
        () => sut.execute(null, admin, source, destination, description, value),
        () => sut.execute(id, null, source, destination, description, value),
        () => sut.execute(id, admin, null, destination, description, value),
        () => sut.execute(id, admin, source, null, description, value),
        () => sut.execute(id, admin, source, destination, null, value),
        () => sut.execute(id, admin, source, destination, description, null),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if admin banking ted already exists and user is forbidden', async () => {
      const {
        sut,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const admin = await AdminFactory.create<AdminEntity>(AdminEntity.name);

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      const { id, source, destination, description, value } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );

      const testScript = () =>
        sut.execute(id, admin, source, destination, description, value);

      await expect(testScript).rejects.toThrow(ForbiddenException);

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if source account and destination account are same account', async () => {
      const {
        sut,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      const {
        id,
        createdByAdmin: admin,
        source,
        description,
        value,
      } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(id, admin, source, source, description, value);

      await expect(testScript).rejects.toThrow(
        AdminBankingTedBetweenSameAccountException,
      );

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if source account not found', async () => {
      const {
        sut,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      const {
        id,
        createdByAdmin: admin,
        destination,
        source,
        description,
        value,
      } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(null);
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(id, admin, source, destination, description, value);

      await expect(testScript).rejects.toThrow(
        AdminBankingAccountNotFoundException,
      );

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenNthCalledWith(
        1,
        source.id,
      );
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if source account not active', async () => {
      const {
        sut,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const sourceAccount =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: false,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            source: sourceAccount,
          },
        );

      const {
        id,
        createdByAdmin: admin,
        destination,
        source,
        description,
        value,
      } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(null);
      mockGetAdminBankingAccountByIdRepository.mockResolvedValueOnce(
        sourceAccount,
      );

      const testScript = () =>
        sut.execute(id, admin, source, destination, description, value);

      await expect(testScript).rejects.toThrow(
        AdminBankingAccountNotActiveException,
      );

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenNthCalledWith(
        1,
        source.id,
      );
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not create if destination account not found', async () => {
      const {
        sut,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const sourceAccount =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: true,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      const {
        id,
        createdByAdmin: admin,
        destination,
        source,
        description,
        value,
      } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(null);
      mockGetAdminBankingAccountByIdRepository
        .mockResolvedValueOnce(sourceAccount)
        .mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(id, admin, source, destination, description, value);

      await expect(testScript).rejects.toThrow(
        AdminBankingAccountNotFoundException,
      );

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenNthCalledWith(
        2,
        destination.id,
      );
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not create if destination account not active', async () => {
      const {
        sut,
        mockCreateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockGetAdminBankingAccountByIdRepository,
        mockPendingAdminBankingTedEventEmitter,
      } = makeSut();

      const sourceAccount =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: true,
          },
        );

      const destinationAccount =
        await AdminBankingAccountFactory.create<AdminBankingAccountEntity>(
          AdminBankingAccountEntity.name,
          {
            enabled: false,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      const {
        id,
        createdByAdmin: admin,
        destination,
        source,
        description,
        value,
      } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(null);
      mockGetAdminBankingAccountByIdRepository
        .mockResolvedValueOnce(sourceAccount)
        .mockResolvedValueOnce(destinationAccount);

      const testScript = () =>
        sut.execute(id, admin, source, destination, description, value);

      await expect(testScript).rejects.toThrow(
        AdminBankingAccountNotActiveException,
      );

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAdminBankingAccountByIdRepository).toHaveBeenNthCalledWith(
        2,
        destination.id,
      );
      expect(mockCreateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockPendingAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
