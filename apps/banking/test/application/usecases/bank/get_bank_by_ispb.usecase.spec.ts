import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankRepository } from '@zro/banking/domain';
import { BankingService } from '@zro/pix-payments/application';
import { GetBankByIspbUseCase as UseCase } from '@zro/banking/application';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankDatabaseRepository, BankModel } from '@zro/banking/infrastructure';
import { BankFactory } from '@zro/test/banking/config';

describe('GetBankByIspbUseCase', () => {
  let module: TestingModule;
  let bankRepository: BankRepository;

  const getBankByIspb: BankingService = createMock<BankingService>();
  const mockGetBankByIspbService: jest.Mock = On(getBankByIspb).get(
    method((mock) => mock.getBankByIspb),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankRepository = new BankDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get bank name and code successfully by ispb', async () => {
      const bank = await BankFactory.create<BankModel>(BankModel.name);

      mockGetBankByIspbService.mockResolvedValue(bank);

      const usecase = new UseCase(logger, bankRepository);

      const result = await usecase.execute(bank.ispb);

      expect(result).toBeDefined();
      expect(result.id).toBe(bank.id);
      expect(result.name).toBe(bank.name);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get bank name and code when ispb is not valid', async () => {
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
