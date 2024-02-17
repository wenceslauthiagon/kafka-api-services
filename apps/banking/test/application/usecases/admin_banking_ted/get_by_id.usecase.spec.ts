import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingTedEntity,
  AdminBankingTedRepository,
} from '@zro/banking/domain';
import { GetAdminBankingTedByIdUseCase as UseCase } from '@zro/banking/application';
import { AdminBankingTedFactory } from '@zro/test/banking/config';

describe('GetAdminBankingTedByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { AdminbankingTedRepository, mockGetAdminBankingTedByIdRepository } =
      mockRepository();

    const sut = new UseCase(logger, AdminbankingTedRepository);
    return {
      sut,
      mockGetAdminBankingTedByIdRepository,
    };
  };

  const mockRepository = () => {
    const AdminbankingTedRepository: AdminBankingTedRepository =
      createMock<AdminBankingTedRepository>();
    const mockGetAdminBankingTedByIdRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.getById));

    return {
      AdminbankingTedRepository,
      mockGetAdminBankingTedByIdRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get admin banking TED successfully by id', async () => {
      const { sut, mockGetAdminBankingTedByIdRepository } = makeSut();

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedEntity>(
          AdminBankingTedEntity.name,
        );

      const { id } = adminBankingTed;

      mockGetAdminBankingTedByIdRepository.mockResolvedValueOnce(
        adminBankingTed,
      );

      const result = await sut.execute(id);

      expect(result).toBeDefined();
      expect(result.id).toBe(adminBankingTed.id);
      expect(result.source).toBe(adminBankingTed.source);
      expect(result.destination).toBe(adminBankingTed.destination);
      expect(result.value).toBe(adminBankingTed.value);
      expect(result.transactionId).toBe(adminBankingTed.transactionId);
      expect(result.state).toBe(adminBankingTed.state);
      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get admin banking TED by id is not valid', async () => {
      const { sut, mockGetAdminBankingTedByIdRepository } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockGetAdminBankingTedByIdRepository).toHaveBeenCalledTimes(0);
    });
  });
});
