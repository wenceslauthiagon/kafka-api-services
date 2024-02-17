import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingTedEntity,
  AdminBankingTedRepository,
} from '@zro/banking/domain';
import { GetAdminBankingTedByTransactionIdUseCase as UseCase } from '@zro/banking/application';
import { AdminBankingTedFactory } from '@zro/test/banking/config';

describe('GetAdminBankingTedByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByTransactionIdRepository,
    } = mockRepository();

    const sut = new UseCase(logger, AdminbankingTedRepository);
    return {
      sut,
      mockGetAdminBankingTedByTransactionIdRepository,
    };
  };

  const mockRepository = () => {
    const AdminbankingTedRepository: AdminBankingTedRepository =
      createMock<AdminBankingTedRepository>();
    const mockGetAdminBankingTedByTransactionIdRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.getByTransactionId));

    return {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByTransactionIdRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get admin banking TED successfully by transaction id', async () => {
      const { sut, mockGetAdminBankingTedByTransactionIdRepository } =
        makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      mockGetAdminBankingTedByTransactionIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );

      const { transactionId } = adminBankingTed;

      const result = await sut.execute(transactionId);

      expect(result).toBeDefined();
      expect(result.id).toBe(adminBankingTed.id);
      expect(result.source).toBe(adminBankingTed.source);
      expect(result.destination).toBe(adminBankingTed.destination);
      expect(result.value).toBe(adminBankingTed.value);
      expect(result.transactionId).toBe(adminBankingTed.transactionId);
      expect(result.state).toBe(adminBankingTed.state);
      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockGetAdminBankingTedByTransactionIdRepository).toBeCalledWith(
        transactionId,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get admin banking TED by id is not valid', async () => {
      const { sut, mockGetAdminBankingTedByTransactionIdRepository } =
        makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);

      expect(
        mockGetAdminBankingTedByTransactionIdRepository,
      ).toHaveBeenCalledTimes(0);
    });
  });
});
