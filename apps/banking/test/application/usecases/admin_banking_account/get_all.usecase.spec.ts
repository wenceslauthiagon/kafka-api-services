import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingAccountEntity,
  AdminBankingAccountRepository,
  TGetAdminBankingAccountFilter,
} from '@zro/banking/domain';
import { GetAllAdminBankingAccountUseCase as UseCase } from '@zro/banking/application';
import { AdminBankingAccountFactory } from '@zro/test/banking/config';

describe('GetAllAdminBankingAccountUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      AdminbankingAccountRepository,
      mockGetByFilterAndPaginationRepository,
    } = mockRepository();

    const sut = new UseCase(logger, AdminbankingAccountRepository);
    return {
      sut,
      mockGetByFilterAndPaginationRepository,
    };
  };

  const mockRepository = () => {
    const AdminbankingAccountRepository: AdminBankingAccountRepository =
      createMock<AdminBankingAccountRepository>();
    const mockGetByFilterAndPaginationRepository: jest.Mock = On(
      AdminbankingAccountRepository,
    ).get(method((mock) => mock.getByFilterAndPagination));

    return {
      AdminbankingAccountRepository,
      mockGetByFilterAndPaginationRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get all adminBankingAccounts successfully', async () => {
      const { sut, mockGetByFilterAndPaginationRepository } = makeSut();

      await AdminBankingAccountFactory.createMany<AdminBankingAccountEntity>(
        AdminBankingAccountEntity.name,
        3,
      );

      const pagination = new PaginationEntity();
      const filter: TGetAdminBankingAccountFilter = {};

      const result = await sut.execute(pagination, filter);

      expect(result).toBeDefined();
      expect(mockGetByFilterAndPaginationRepository).toHaveBeenCalledTimes(1);
    });
  });
});
