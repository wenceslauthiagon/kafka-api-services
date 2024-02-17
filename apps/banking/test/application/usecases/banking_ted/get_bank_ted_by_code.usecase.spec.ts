import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankTedRepository } from '@zro/banking/domain';
import { GetBankTedByCodeUseCase as UseCase } from '@zro/banking/application';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  BankTedDatabaseRepository,
  BankTedModel,
} from '@zro/banking/infrastructure';
import { BankTedFactory } from '@zro/test/banking/config';

describe('GetBankTedByCodeUseCase', () => {
  let module: TestingModule;
  let bankTedRepository: BankTedRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankTedRepository = new BankTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get bankTed successfully by code', async () => {
      const bankTed = await BankTedFactory.create<BankTedModel>(
        BankTedModel.name,
      );

      const usecase = new UseCase(logger, bankTedRepository);

      const result = await usecase.execute(bankTed.code);

      expect(result).toBeDefined();
      expect(result.id).toBe(bankTed.id);
      expect(result.name).toBe(bankTed.name);
      expect(result.code).toBe(bankTed.code);
      expect(result.ispb).toBe(bankTed.ispb);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get bankTed when code is not valid', async () => {
      const usecase = new UseCase(logger, bankTedRepository);

      const testScript = () => usecase.execute('');

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
