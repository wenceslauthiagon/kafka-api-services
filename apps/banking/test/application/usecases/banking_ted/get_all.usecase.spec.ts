import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  BankingTedRepository,
  TGetBankingTedFilter,
} from '@zro/banking/domain';
import { GetAllBankingTedUseCase as UseCase } from '@zro/banking/application';
import {
  BankingTedDatabaseRepository,
  BankingTedModel,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankingTedFactory } from '@zro/test/banking/config';

describe('GetAllBankingTedUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  let module: TestingModule;
  let bankingTedRepository: BankingTedRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankingTedRepository = new BankingTedDatabaseRepository();
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should get all bankingTeds successfully', async () => {
      const userId = uuidV4();
      await BankingTedFactory.createMany<BankingTedModel>(
        BankingTedModel.name,
        3,
        { userId },
      );

      const usecase = new UseCase(logger, bankingTedRepository);

      const user = new UserEntity({ uuid: userId });
      const pagination = new PaginationEntity();
      const filter: TGetBankingTedFilter = {};

      const result = await usecase.execute(pagination, user, filter);

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
        expect(res.id).toBeDefined();
        expect(res.operation.id).toBeDefined();
        expect(res.transactionId).toBeDefined();
        expect(res.user).toBeDefined();
        expect(res.state).toBeDefined();
        expect(res.amount).toBeDefined();
        expect(res.operation).toBeDefined();
        expect(res.beneficiaryBankCode).toBeDefined();
        expect(res.beneficiaryBankName).toBeDefined();
        expect(res.beneficiaryName).toBeDefined();
        expect(res.beneficiaryType).toBeDefined();
        expect(res.beneficiaryDocument).toBeDefined();
        expect(res.beneficiaryAgency).toBeDefined();
        expect(res.beneficiaryAccount).toBeDefined();
        expect(res.beneficiaryAccountDigit).toBeDefined();
        expect(res.beneficiaryAccountType).toBeDefined();
        expect(res.createdAt).toBeDefined();
        expect(res.updatedAt).toBeDefined();
        expect(res.confirmedAt).toBeDefined();
        expect(res.failedAt).toBeDefined();
        expect(res.forwardedAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
