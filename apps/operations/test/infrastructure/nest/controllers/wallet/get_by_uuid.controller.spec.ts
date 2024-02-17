import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { WalletRepository } from '@zro/operations/domain';
import {
  GetWalletByUuidMicroserviceController as Controller,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { GetWalletByUuidRequest } from '@zro/operations/interface';
import { WalletFactory } from '@zro/test/operations/config';

describe('GetWalletByUuidMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletRepository: WalletRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletRepository = new WalletDatabaseRepository();
  });

  describe('GetWalletByUuid', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get wallet successfully', async () => {
        const walletCreated = await WalletFactory.create<WalletModel>(
          WalletModel.name,
        );

        const message: GetWalletByUuidRequest = {
          uuid: walletCreated.uuid,
        };

        const result = await controller.execute(
          walletRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(walletCreated.id);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not return wallet if uuid is null', async () => {
        const message: GetWalletByUuidRequest = {
          uuid: null,
        };

        const testScript = () =>
          controller.execute(walletRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
