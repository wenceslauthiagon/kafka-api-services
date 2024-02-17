import { createMock } from 'ts-auto-mock';
import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService, getMoment } from '@zro/common';
import {
  SyncAssetsForfeituresReportsCronService as Cron,
  CurrencyModel,
  OperationModel,
  SyncAssetsForfeituresReportsCronConfig,
  TransactionTypeModel,
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  CurrencyFactory,
  OperationFactory,
  TransactionTypeFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { On, method } from 'ts-auto-mock/extension';
import { ConfigService } from '@nestjs/config';
import { UserFactory } from '@zro/test/users/config';
import { UserEntity } from '@zro/users/domain';
import { OperationType } from '@zro/reports/domain';
import { KAFKA_TOPICS } from '@zro/reports/infrastructure';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('SyncAssetsForfeituresReportsCronService', () => {
  let module: TestingModule;
  let controller: Cron;
  let transactionTag: string;
  let currencySymbol: string;

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockKafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.send),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Cron>(Cron);

    const configService: ConfigService<SyncAssetsForfeituresReportsCronConfig> =
      module.get(ConfigService);

    transactionTag = configService.get<string>(
      'APP_SYNC_ASSETS_FORFEITURES_REPORTS_TRANSACTION_TAG',
    );
    currencySymbol = configService.get<string>(
      'APP_OPERATION_SYMBOL_CURRENCY_REAL',
    );
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should execute successfully', async () => {
      const now = getMoment().toDate();

      const transactionType =
        (await TransactionTypeModel.findOne({
          where: { tag: transactionTag },
        })) ??
        (await TransactionTypeFactory.create<TransactionTypeModel>(
          TransactionTypeModel.name,
          {
            tag: transactionTag,
          },
        ));

      const currency =
        (await CurrencyModel.findOne({
          where: { symbol: currencySymbol },
        })) ??
        (await CurrencyFactory.create<CurrencyModel>(CurrencyModel.name, {
          symbol: currencySymbol,
        }));

      const owner = await UserFactory.create<UserEntity>(UserEntity.name);
      const ownerWallet = await WalletFactory.create<WalletModel>(
        WalletModel.name,
        {
          userId: owner.id,
          userUUID: owner.uuid,
        },
      );
      const ownerWalletAccount =
        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          { walletId: ownerWallet.id, currencyId: currency.id },
        );

      await OperationFactory.create<OperationModel>(OperationModel.name, {
        ownerId: owner.id,
        ownerWalletAccountId: ownerWalletAccount.id,
        beneficiaryId: null,
        beneficiaryWalletAccountId: null,
        currencyId: currency.id,
        transactionTypeId: transactionType.id,
        createdAt: now,
        chargeback: null,
      });

      jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

      mockKafkaService.mockResolvedValue(owner);

      await controller.execute();

      expect(mockKafkaService).toHaveBeenCalledTimes(2);
      expect(mockKafkaService).toHaveBeenNthCalledWith(
        2,
        KAFKA_TOPICS.REPORT_OPERATION.CREATE,
        expect.objectContaining({
          value: expect.objectContaining({ operationType: OperationType.D }),
        }),
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
