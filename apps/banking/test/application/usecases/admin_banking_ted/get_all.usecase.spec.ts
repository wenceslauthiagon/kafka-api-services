import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import {
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  TGetAdminBankingTedFilter,
} from '@zro/banking/domain';
import { GetAllAdminBankingTedUseCase as UseCase } from '@zro/banking/application';
import { AdminBankingTedFactory } from '@zro/test/banking/config';

describe('GetAllAdminBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      AdminbankingTedRepository,
      mockGetByFilterAndPaginationRepository,
    } = mockRepository();

    const sut = new UseCase(logger, AdminbankingTedRepository);
    return {
      sut,
      mockGetByFilterAndPaginationRepository,
    };
  };

  const mockRepository = () => {
    const AdminbankingTedRepository: AdminBankingTedRepository =
      createMock<AdminBankingTedRepository>();
    const mockGetByFilterAndPaginationRepository: jest.Mock = On(
      AdminbankingTedRepository,
    ).get(method((mock) => mock.getByFilterAndPagination));

    return {
      AdminbankingTedRepository,
      mockGetByFilterAndPaginationRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get all adminBankingTeds successfully', async () => {
      const { sut, mockGetByFilterAndPaginationRepository } = makeSut();

      await AdminBankingTedFactory.createMany<AdminBankingTedEntity>(
        AdminBankingTedEntity.name,
        3,
      );

      const pagination = new PaginationEntity();
      const filter: TGetAdminBankingTedFilter = {};

      const result = await sut.execute(pagination, filter);

      expect(result).toBeDefined();
      expect(mockGetByFilterAndPaginationRepository).toHaveBeenCalledTimes(1);
    });
  });
});
