import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  WalletAccountModel,
  GetAllWalletAccountMicroserviceController as Controller,
  WalletAccountDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { GetAllWalletAccountRequest } from '@zro/operations/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllWalletAccountMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  const walletAccountRepository = new WalletAccountDatabaseRepository();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetAllWalletAccounts', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to get currencies by filter successfully', async () => {
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
          );

        const message: GetAllWalletAccountRequest = {
          userId: uuidV4(),
          walletId: walletAccount.walletUUID,
        };

        const result = await controller.execute(
          walletAccountRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.page).toBe(1);
        expect(result.value.total).toBe(1);
        expect(result.value.pageTotal).toBe(1);
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.balance).toBe(walletAccount.balance);
          expect(res.pendingAmount).toBe(walletAccount.pendingAmount);
          expect(res.averagePrice).toBe(walletAccount.averagePrice);
          expect(res.currencyId).toBe(walletAccount.currencyId);
          expect(res.currencySymbol).toBeDefined();
          expect(res.currencyTitle).toBeDefined();
          expect(res.currencySymbolAlign).toBeDefined();
        });
      });

      it('TC0002 - Should be able get an empty array with no walletAccount was found', async () => {
        await WalletAccountFactory.createMany<WalletAccountModel>(
          WalletAccountModel.name,
          2,
        );

        const message: GetAllWalletAccountRequest = {
          userId: uuidV4(),
          walletId: uuidV4(),
        };

        const result = await controller.execute(
          walletAccountRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.data.length).toBe(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
