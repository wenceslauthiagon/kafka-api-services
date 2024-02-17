import { v4 as uuidV4 } from 'uuid';
import { Mutex } from 'redis-semaphore';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '@zro/common';
import { JdpiBankService } from '@zro/jdpi';
import { BankEntity } from '@zro/banking/domain';
import { BankGateway, GetAllBankPspResponse } from '@zro/banking/application';
import {
  BankCronServiceInit as Cron,
  BankModel,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankFactory } from '@zro/test/banking/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('BankCronServiceInit', () => {
  let module: TestingModule;
  let controller: Cron;

  const kafkaService: KafkaService = createMock<KafkaService>();

  const mockJdpiService: JdpiBankService = createMock<JdpiBankService>();
  const mockGetBankGateway: jest.Mock = On(mockJdpiService).get(
    method((mock) => mock.getBankGateway),
  );
  const mockJdpiBankGateway: BankGateway = createMock<BankGateway>();
  const mockGetAllBank: jest.Mock = On(mockJdpiBankGateway).get(
    method((mock) => mock.getAllBank),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .overrideProvider(JdpiBankService)
      .useValue(mockJdpiService)
      .compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    await BankModel.truncate();
    jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);
    mockGetBankGateway.mockReturnValue(mockJdpiBankGateway);
  });

  describe('Sync banks', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create the bank successfully', async () => {
        const bank = await BankFactory.create<BankEntity>(BankEntity.name, {
          active: true,
        });
        const newBank: GetAllBankPspResponse = {
          ispb: bank.ispb,
          name: bank.name,
          fullName: bank.fullName,
          startedAt: bank.startedAt,
        };
        mockGetAllBank.mockResolvedValue([newBank]);

        await controller.syncBank();

        const result = await BankModel.findOne({ where: { ispb: bank.ispb } });

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.ispb).toBe(bank.ispb);
        expect(result.name).toBe(newBank.name);
        expect(result.deletedAt).toBeNull();
        expect(mockGetBankGateway).toHaveBeenCalledTimes(1);
        expect(mockGetAllBank).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should reactive the deleted bank successfully', async () => {
        const bank = await BankFactory.create<BankModel>(BankModel.name, {
          active: true,
          deletedAt: new Date(),
        });
        const newBank: GetAllBankPspResponse = {
          ispb: bank.ispb,
          name: uuidV4(),
          fullName: bank.fullName,
          startedAt: bank.startedAt,
        };
        mockGetAllBank.mockResolvedValue([newBank]);

        await controller.syncBank();

        const result = await BankModel.findOne({ where: { ispb: bank.ispb } });

        expect(result).toBeDefined();
        expect(result.id).toBe(bank.id);
        expect(result.ispb).toBe(bank.ispb);
        expect(result.name).toBe(newBank.name);
        expect(result.deletedAt).toBeNull();
        expect(mockGetBankGateway).toHaveBeenCalledTimes(1);
        expect(mockGetAllBank).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should execute nothing the bank created successfully', async () => {
        const bank = await BankFactory.create<BankModel>(BankModel.name, {
          active: true,
          deletedAt: null,
        });
        const newBank: GetAllBankPspResponse = {
          ispb: bank.ispb,
          name: bank.name,
          fullName: bank.fullName,
          startedAt: bank.startedAt,
        };
        mockGetAllBank.mockResolvedValue([newBank]);

        await controller.syncBank();

        const result = await BankModel.findOne({ where: { ispb: bank.ispb } });

        expect(result).toBeDefined();
        expect(result.id).toBe(bank.id);
        expect(result.ispb).toBe(bank.ispb);
        expect(result.name).toBe(bank.name);
        expect(result.deletedAt).toBeNull();
        expect(mockGetBankGateway).toHaveBeenCalledTimes(1);
        expect(mockGetAllBank).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
