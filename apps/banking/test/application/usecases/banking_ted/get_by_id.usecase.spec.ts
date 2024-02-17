import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankingTedRepository } from '@zro/banking/domain';
import { GetBankingTedByIdUseCase as UseCase } from '@zro/banking/application';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  BankingTedDatabaseRepository,
  BankingTedModel,
} from '@zro/banking/infrastructure';
import { BankingTedFactory } from '@zro/test/banking/config';

describe('GetBankingTedByIdUseCase', () => {
  let module: TestingModule;
  let bankingTedRepository: BankingTedRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankingTedRepository = new BankingTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get bankingTed successfully by id', async () => {
      const bankingTed = await BankingTedFactory.create<BankingTedModel>(
        BankingTedModel.name,
      );

      const usecase = new UseCase(logger, bankingTedRepository);

      const result = await usecase.execute(bankingTed.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(bankingTed.id);
      expect(result.transactionId).toBe(bankingTed.transactionId);
      expect(result.beneficiaryBankCode).toBe(bankingTed.beneficiaryBankCode);
      expect(result.beneficiaryBankName).toBe(bankingTed.beneficiaryBankName);
      expect(result.beneficiaryName).toBe(bankingTed.beneficiaryName);
      expect(result.beneficiaryType).toBe(bankingTed.beneficiaryType);
      expect(result.beneficiaryDocument).toBe(bankingTed.beneficiaryDocument);
      expect(result.beneficiaryAgency).toBe(bankingTed.beneficiaryAgency);
      expect(result.beneficiaryAccount).toBe(bankingTed.beneficiaryAccount);
      expect(result.beneficiaryAccountDigit).toBe(
        bankingTed.beneficiaryAccountDigit,
      );
      expect(result.beneficiaryAccountType).toBe(
        bankingTed.beneficiaryAccountType,
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get bankingTed by id is not valid', async () => {
      const usecase = new UseCase(logger, bankingTedRepository);

      const testScript = () => usecase.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
