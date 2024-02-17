import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  CurrencyRepository,
  WalletAccountRepository,
} from '@zro/operations/domain';
import { CurrencyNotFoundException } from '@zro/operations/application';
import {
  WalletAccountModel,
  GetWalletAccountByWalletAndCurrencyMicroserviceController as Controller,
  WalletAccountDatabaseRepository,
  CurrencyDatabaseRepository,
  CurrencyModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  CurrencyFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetWalletAccountByWalletAndCurrencyRequest } from '@zro/operations/interface';

describe('GetWalletAccountByWalletAndCurrencyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletAccountRepository: WalletAccountRepository;
  let currencyRepository: CurrencyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletAccountRepository = new WalletAccountDatabaseRepository();
    currencyRepository = new CurrencyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetWalletAccountByWalletAndCurrency', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get wallet account successfully', async () => {
        const currency = await CurrencyFactory.create<CurrencyModel>(
          CurrencyModel.name,
        );

        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
            { currencyId: currency.id },
          );

        const message: GetWalletAccountByWalletAndCurrencyRequest = {
          walletId: walletAccount.walletUUID,
          currencyTag: currency.tag,
        };

        const result = await controller.execute(
          walletAccountRepository,
          currencyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(walletAccount.id);
        expect(result.value.walletId).toBe(walletAccount.walletUUID);
        expect(result.value.accountId).toBeDefined();
        expect(result.value.currencyId).toBe(currency.id);
        expect(result.value.pendingAmount).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get wallet account if currency tag is null', async () => {
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
          );

        const message: GetWalletAccountByWalletAndCurrencyRequest = {
          walletId: walletAccount.walletUUID,
          currencyTag: null,
        };

        await expect(() =>
          controller.execute(
            walletAccountRepository,
            currencyRepository,
            logger,
            message,
            ctx,
          ),
        ).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - Should not get wallet account if currency not exist', async () => {
        const walletAccount =
          await WalletAccountFactory.create<WalletAccountModel>(
            WalletAccountModel.name,
          );

        const message: GetWalletAccountByWalletAndCurrencyRequest = {
          walletId: walletAccount.walletUUID,
          currencyTag: faker.random.alpha({ count: 5, casing: 'upper' }),
        };

        await expect(() =>
          controller.execute(
            walletAccountRepository,
            currencyRepository,
            logger,
            message,
            ctx,
          ),
        ).rejects.toThrow(CurrencyNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
