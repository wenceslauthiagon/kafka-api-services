import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  ForwardAdminBankingTedUseCase as UseCase,
  AdminBankingTedEventEmitter,
  AdminBankingTedInvalidStateException,
  AdminBankingTedNotFoundException,
} from '@zro/banking/application';
import { AdminBankingTedFactory } from '@zro/test/banking/config';

describe('ForwardAdminBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      adminBankingTedRepository,
      mockUpdateAdminBankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockForwardedEventEmitter } = mockEmitter();

    const sut = new UseCase(logger, adminBankingTedRepository, eventEmitter);
    return {
      sut,
      mockUpdateAdminBankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
      mockForwardedEventEmitter,
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
    const mockForwardedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.forwardedAdminBankingTed),
    );

    return {
      eventEmitter,
      mockForwardedEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle forwarded when id is null', async () => {
      const {
        sut,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mockForwardedEventEmitter,
      } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockForwardedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not handle forwarded when adminBankingTed not found', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockForwardedEventEmitter,
      } = makeSut();

      const { id } = await AdminBankingTedFactory.create<AdminBankingTedEntity>(
        AdminBankingTedEntity.name,
      );

      mockGetAdminBankingTedByIdRepository.mockResolvedValue(undefined);

      const test = () => sut.execute(id);

      await expect(test).rejects.toThrow(AdminBankingTedNotFoundException);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledWith(id);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockForwardedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not handle forwarded when adminBankingTed is already forwarded', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockForwardedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          { state: AdminBankingTedState.FORWARDED },
        );

      mockGetAdminBankingTedByIdRepository.mockResolvedValue(adminBankingTed);

      const result = await sut.execute(adminBankingTed.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(AdminBankingTedState.FORWARDED);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledWith(
        adminBankingTed.id,
      );
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mockForwardedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not handle forwarded when status is not confirmed', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockForwardedEventEmitter,
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
      expect(mockForwardedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should handle forwarded adminBankingTed', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mockForwardedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          { state: AdminBankingTedState.CONFIRMED },
        );

      mockGetAdminBankingTedByIdRepository.mockResolvedValue(adminBankingTed);

      const result = await sut.execute(adminBankingTed.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(AdminBankingTedState.FORWARDED);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledWith(
        adminBankingTed.id,
      );
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mockForwardedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
