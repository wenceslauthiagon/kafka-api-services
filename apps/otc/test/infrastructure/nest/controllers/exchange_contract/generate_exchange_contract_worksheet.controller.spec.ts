import { v4 as uuidV4 } from 'uuid';
import { FileEntity } from '@zro/storage/domain';
import { defaultLogger as logger } from '@zro/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeContractRepository } from '@zro/otc/domain';
import {
  ExchangeContractModel,
  GenerateExchangeContractWorksheetMicroserviceController as Controller,
  ExchangeContractDatabaseRepository,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ExchangeContractFactory } from '@zro/test/otc/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  ExchangeContractsNotFoundByFilterException,
  StorageService,
} from '@zro/otc/application';
import { GenerateExchangeContractWorksheetRequest } from '@zro/otc/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GenerateExchangeContractWorksheetMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let exchangeContractRepository: ExchangeContractRepository;

  const storageService: StorageService = createMock<StorageService>();
  const mockStorageFileService: jest.Mock = On(storageService).get(
    method((mock) => mock.uploadFile),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    exchangeContractRepository = new ExchangeContractDatabaseRepository();
  });

  beforeEach(() => mockStorageFileService.mockReset());

  describe('GenerateExchangeContractWorksheet', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to generate exchange contracts worksheet successfully', async () => {
        const exchangeContracts =
          await ExchangeContractFactory.createMany<ExchangeContractModel>(
            ExchangeContractModel.name,
            5,
          );

        const exchangeContractIds = exchangeContracts.map((ec) => ec.id);

        const file = new FileEntity({
          id: 'b014070e-263f-4563-ac0c-5e983a6f5738',
          fileName: 'random-filename',
          createdAt: new Date(),
        });

        mockStorageFileService.mockResolvedValue(file);

        const message: GenerateExchangeContractWorksheetRequest = {
          exchangeContractIds,
        };

        const result = await controller.execute(
          exchangeContractRepository,
          logger,
          storageService,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(mockStorageFileService).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should be able to generate exchange contracts worksheet with incorrect id passed', async () => {
        await ExchangeContractFactory.createMany<ExchangeContractModel>(
          ExchangeContractModel.name,
          5,
        );

        const file = new FileEntity({
          id: 'b014070e-263f-4563-ac0c-5e983a6f5738',
          fileName: 'random-filename',
          createdAt: new Date(),
        });

        mockStorageFileService.mockResolvedValue(file);

        const message: GenerateExchangeContractWorksheetRequest = {
          exchangeContractIds: [uuidV4()],
        };

        const testScript = () =>
          controller.execute(
            exchangeContractRepository,
            logger,
            storageService,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          ExchangeContractsNotFoundByFilterException,
        );
        expect(mockStorageFileService).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
