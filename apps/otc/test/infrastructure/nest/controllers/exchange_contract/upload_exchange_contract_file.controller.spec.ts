import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { ExchangeContractRepository } from '@zro/otc/domain';
import {
  ExchangeContractDatabaseRepository,
  ExchangeContractModel,
  UploadExchangeContractFileMicroserviceController as Controller,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ExchangeContractFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import { UploadExchangeContractFileRequest } from '@zro/otc/interface';

describe('UploadExchangeContractFileMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let exchangeContractRepository: ExchangeContractRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    exchangeContractRepository = new ExchangeContractDatabaseRepository();
  });

  describe('Upload Exchange Contract File', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to upload exchange contract file successfully', async () => {
        const exchangeContract =
          await ExchangeContractFactory.create<ExchangeContractModel>(
            ExchangeContractModel.name,
            {
              fileId: uuidV4(),
            },
          );

        const message: UploadExchangeContractFileRequest = {
          id: exchangeContract.id,
          fileId: exchangeContract.fileId,
        };

        const result = await controller.execute(
          exchangeContractRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able to upload exchange contract file with incorrect data type', async () => {
        await ExchangeContractFactory.create<ExchangeContractModel>(
          ExchangeContractModel.name,
        );

        const message: UploadExchangeContractFileRequest = {
          fileId: null,
          id: null,
        };

        const testScript = () =>
          controller.execute(exchangeContractRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
