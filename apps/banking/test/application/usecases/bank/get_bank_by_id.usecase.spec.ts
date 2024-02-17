import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankRepository } from '@zro/banking/domain';
import { GetBankByIdUseCase as UseCase } from '@zro/banking/application';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankDatabaseRepository, BankModel } from '@zro/banking/infrastructure';
import { BankFactory } from '@zro/test/banking/config';

describe('GetBankByIdUseCase', () => {
  let module: TestingModule;
  let bankRepository: BankRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankRepository = new BankDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get bank name and code successfully by id', async () => {
      const bank = await BankFactory.create<BankModel>(BankModel.name);

      const usecase = new UseCase(logger, bankRepository);

      const result = await usecase.execute(bank.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(bank.id);
      expect(result.name).toBe(bank.name);
      expect(result.ispb).toBe(bank.ispb);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get bank name and code when id is not valid', async () => {
      const usecase = new UseCase(logger, bankRepository);

      const testScript = () => usecase.execute('');

      await expect(testScript).rejects.toThrow(MissingDataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
