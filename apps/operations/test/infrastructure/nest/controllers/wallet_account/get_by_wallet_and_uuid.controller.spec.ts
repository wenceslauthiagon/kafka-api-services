import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { WalletAccountRepository } from '@zro/operations/domain';
import {
  WalletAccountModel,
  GetWalletAccountByWalletAndUuidMicroserviceController as Controller,
  WalletAccountDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { WalletAccountFactory } from '@zro/test/operations/config';
import { GetWalletAccountByWalletAndUuidRequest } from '@zro/operations/interface';

describe('GetWalletAccountByWalletAndUuidMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletAccountRepository: WalletAccountRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletAccountRepository = new WalletAccountDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetWalletAccountByWalletAndUuid', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not get wallet account if missing data', async () => {
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
          );

        const message: GetWalletAccountByWalletAndUuidRequest = {
          walletId: walletAccount.walletUUID,
          uuid: null,
        };

        await expect(() =>
          controller.execute(walletAccountRepository, logger, message, ctx),
        ).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should get wallet account successfully', async () => {
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
          );

        const message: GetWalletAccountByWalletAndUuidRequest = {
          walletId: walletAccount.walletUUID,
          uuid: walletAccount.uuid,
        };

        const result = await controller.execute(
          walletAccountRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(walletAccount.id);
        expect(result.value.walletId).toBe(walletAccount.walletUUID);
        expect(result.value.accountId).toBeDefined();
        expect(result.value.pendingAmount).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
