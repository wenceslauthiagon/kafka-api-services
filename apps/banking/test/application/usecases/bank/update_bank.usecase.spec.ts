import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankRepository } from '@zro/banking/domain';
import {
  BankEventEmitter,
  BankNotFoundException,
  UpdateBankUseCase as UseCase,
} from '@zro/banking/application';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankDatabaseRepository, BankModel } from '@zro/banking/infrastructure';
import { BankFactory } from '@zro/test/banking/config';

describe('UpdateBankUseCase', () => {
  let module: TestingModule;
  let bankRepository: BankRepository;

  const eventEmitter: BankEventEmitter = createMock<BankEventEmitter>();
  const mockUpdatedEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.updatedBank),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    bankRepository = new BankDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should update bank successfully, when bank is inactive', async () => {
      const bank = await BankFactory.create<BankModel>(BankModel.name, {
        active: false,
      });
      const active = true;

      const usecase = new UseCase(logger, bankRepository, eventEmitter);

      const result = await usecase.execute(bank.id, active);

      expect(result).toBeDefined();
      expect(result.active).toBe(active);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should update bank successfully, when bank is active', async () => {
      const bank = await BankFactory.create<BankModel>(BankModel.name, {
        active: true,
      });
      const active = false;

      const usecase = new UseCase(logger, bankRepository, eventEmitter);

      const result = await usecase.execute(bank.id, active);

      expect(result).toBeDefined();
      expect(result.active).toBe(active);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not update bank when bank is not found', async () => {
      const usecase = new UseCase(logger, bankRepository, eventEmitter);

      const testScript = () => usecase.execute(uuidV4(), false);

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not update bank, when active is undefined', async () => {
      const usecase = new UseCase(logger, bankRepository, eventEmitter);

      const testScript = () => usecase.execute(uuidV4(), undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not update bank, when active is null', async () => {
      const usecase = new UseCase(logger, bankRepository, eventEmitter);

      const testScript = () => usecase.execute(uuidV4(), null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
