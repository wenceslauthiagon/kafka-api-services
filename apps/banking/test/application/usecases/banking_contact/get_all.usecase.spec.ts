import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  PaginationEntity,
  defaultLogger as logger,
  paginationToDomain,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  BankingContactEntity,
  BankingContactRepository,
  TGetBankingContactFilter,
} from '@zro/banking/domain';
import { GetAllBankingContactUseCase as UseCase } from '@zro/banking/application';
import { BankingContactFactory } from '@zro/test/banking/config';
import { UserFactory } from '@zro/test/users/config';

describe('GetAllBankingContactUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const bankingContactRepository: BankingContactRepository =
      createMock<BankingContactRepository>();
    const mockGetRepository: jest.Mock = On(bankingContactRepository).get(
      method((mock) => mock.getByFilterAndUserAndPagination),
    );

    return { bankingContactRepository, mockGetRepository };
  };

  const makeSut = () => {
    const { bankingContactRepository, mockGetRepository } = mockRepository();
    const sut = new UseCase(logger, bankingContactRepository);
    return {
      sut,
      mockGetRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get all BankingContacts successfully', async () => {
      const { sut, mockGetRepository } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const bankingContacts =
        await BankingContactFactory.createMany<BankingContactEntity>(
          BankingContactEntity.name,
          3,
          { user },
        );

      const pagination = new PaginationEntity();
      const filter: TGetBankingContactFilter = {};

      mockGetRepository.mockReturnValueOnce(
        paginationToDomain(pagination, bankingContacts.length, bankingContacts),
      );

      const result = await sut.execute(user, pagination, filter);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.user.id).toBeDefined();
        expect(res.document).toBeDefined();
      });
    });
  });
});
