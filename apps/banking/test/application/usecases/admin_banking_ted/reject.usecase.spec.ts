import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  RejectAdminBankingTedUseCase as UseCase,
  AdminBankingTedEventEmitter,
  AdminBankingTedInvalidStateException,
  AdminBankingTedNotFoundException,
} from '@zro/banking/application';
import { AdminBankingTedFactory } from '@zro/test/banking/config';

describe('RejectAdminBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      adminBankingTedRepository,
      mockUpdateAdminBankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockFailedEventEmitter } = mockEmitter();

    const sut = new UseCase(logger, adminBankingTedRepository, eventEmitter);
    return {
      sut,
      mockUpdateAdminBankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
      mockFailedEventEmitter,
    };
  };

  const mockRepository = () => {
    const adminBankingTedRepository: AdminBankingTedRepository =
      createMock<AdminBankingTedRepository>();
    const mockUpdateAdminBankingTedRepository: jest.Mock = On(
      adminBankingTedRepository,
    ).get(method((mock) => mock.update));
    const mockGetAdminBankingTedByIdRepository: jest.Mock = On(
      adminBankingTedRepository,
    ).get(method((mock) => mock.getById));

    return {
      adminBankingTedRepository,
      mockUpdateAdminBankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: AdminBankingTedEventEmitter =
      createMock<AdminBankingTedEventEmitter>();
    const mockFailedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.failedAdminBankingTed),
    );

    return {
      eventEmitter,
      mockFailedEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle failed when id is null', async () => {
      const {
        sut,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockFailedEventEmitter,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not handle failed when adminBankingTed not found', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockFailedEventEmitter,
      } = makeSut();

      const { id } = await AdminBankingTedFactory.create<AdminBankingTedEntity>(
        AdminBankingTedEntity.name,
      );

      mockGetAdminBankingTedByIdRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(
        AdminBankingTedNotFoundException,
      );

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle failed when adminBankingTed is already failed', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockFailedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          { state: AdminBankingTedState.FAILED },
        );

      mockGetAdminBankingTedByIdRepository.mockResolvedValue(adminBankingTed);

      const result = await sut.execute(adminBankingTed.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(AdminBankingTedState.FAILED);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledWith(
        adminBankingTed.id,
      );
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not handle failed when status is not confirmed', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockFailedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          { state: AdminBankingTedState.WAITING },
        );

      mockGetAdminBankingTedByIdRepository.mockResolvedValue(adminBankingTed);

      const testScript = () => sut.execute(adminBankingTed.id);

      expect(testScript).rejects.toThrow(AdminBankingTedInvalidStateException);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledWith(
        adminBankingTed.id,
      );
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should handle failed adminBankingTed and revert operation', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockFailedEventEmitter,
      } = makeSut();
      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          { state: AdminBankingTedState.CONFIRMED },
        );

      mockGetAdminBankingTedByIdRepository.mockResolvedValue(adminBankingTed);

      const result = await sut.execute(adminBankingTed.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(AdminBankingTedState.FAILED);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledWith(
        adminBankingTed.id,
      );
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
