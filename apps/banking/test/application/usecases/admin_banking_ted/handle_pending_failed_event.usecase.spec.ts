import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  HandlePendingFailedAdminBankingTedEventUseCase as UseCase,
  AdminBankingTedEventEmitter,
} from '@zro/banking/application';
import { AdminBankingTedFactory } from '@zro/test/banking/config';

describe('HandlePendingFailedAdminBankingTedEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
      mockUpdateAdminBankingTedRepository,
    } = mockRepository();

    const { eventEmitter, mocFailedAdminBankingTedEventEmitter } =
      mockEmitter();

    const sut = new UseCase(logger, AdminbankingTedRepository, eventEmitter);
    return {
      sut,
      mockGetAdminBankingTedByIdRepository,
      mockUpdateAdminBankingTedRepository,
      mocFailedAdminBankingTedEventEmitter,
    };
  };

  const mockRepository = () => {
    const AdminbankingTedRepository: AdminBankingTedRepository =
      createMock<AdminBankingTedRepository>();
    const mockGetAdminBankingTedByIdRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateAdminBankingTedRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.update));

    return {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
      mockUpdateAdminBankingTedRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: AdminBankingTedEventEmitter =
      createMock<AdminBankingTedEventEmitter>();
    const mocFailedAdminBankingTedEventEmitter: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.failedAdminBankingTed));

    return {
      eventEmitter,
      mocFailedAdminBankingTedEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should failed handle pending successfully', async () => {
      const {
        sut,
        mockUpdateAdminBankingTedRepository,
        mockGetAdminBankingTedByIdRepository,
        mocFailedAdminBankingTedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            state: AdminBankingTedState.PENDING,
          },
        );

      const { id } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );

      const result = await sut.execute(id);

      expect(result.state).toBe(AdminBankingTedState.FAILED);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(1);
      expect(mocFailedAdminBankingTedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not failed handle pending when missing params', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mocFailedAdminBankingTedEventEmitter,
      } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mocFailedAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not failed handle pending when state is invalid', async () => {
      const {
        sut,
        mockGetAdminBankingTedByIdRepository,
        mockUpdateAdminBankingTedRepository,
        mocFailedAdminBankingTedEventEmitter,
      } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
          {
            state: AdminBankingTedState.WAITING,
            failedAt: null,
          },
        );

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );

      const result = await sut.execute(adminBankingTed.id);

      expect(result.state).not.toBe(AdminBankingTedState.FAILED);
      expect(result.failedAt).toBeNull();
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateAdminBankingTedRepository).toHaveBeenCalledTimes(0);
      expect(mocFailedAdminBankingTedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
