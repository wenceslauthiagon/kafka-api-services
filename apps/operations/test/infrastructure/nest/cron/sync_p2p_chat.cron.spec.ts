import { createMock } from 'ts-auto-mock';
import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService, getMoment } from '@zro/common';
import {
  SyncP2PChatsReportsCronService as Cron,
  CurrencyModel,
  OperationModel,
  SyncP2PChatsReportsCronConfig,
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

describe('SyncP2PChatsReportsCronService', () => {
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

    const configService: ConfigService<SyncP2PChatsReportsCronConfig> =
      module.get(ConfigService);

    transactionTag = configService.get<string>(
      'APP_SYNC_P2P_CHATS_REPORTS_TRANSACTION_TAG',
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

      const beneficiary = await UserFactory.create<UserEntity>(UserEntity.name);
      const beneficiaryWallet = await WalletFactory.create<WalletModel>(
        WalletModel.name,
        {
          userId: beneficiary.id,
          userUUID: beneficiary.uuid,
        },
      );
      const beneficiaryWalletAccount =
        await WalletAccountFactory.create<WalletAccountModel>(
          WalletAccountModel.name,
          { walletId: beneficiaryWallet.id, currencyId: currency.id },
        );

      await OperationFactory.create<OperationModel>(OperationModel.name, {
        ownerId: owner.id,
        ownerWalletAccountId: ownerWalletAccount.id,
        beneficiaryId: beneficiary.id,
        beneficiaryWalletAccountId: beneficiaryWalletAccount.id,
        currencyId: currency.id,
        transactionTypeId: transactionType.id,
        createdAt: now,
        chargeback: null,
      });

      jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

      mockKafkaService.mockResolvedValueOnce(owner);
      mockKafkaService.mockResolvedValueOnce(beneficiary);

      await controller.execute();

      expect(mockKafkaService).toHaveBeenCalledTimes(4);
      expect(mockKafkaService).toHaveBeenNthCalledWith(
        3,
        KAFKA_TOPICS.REPORT_OPERATION.CREATE,
        expect.objectContaining({
          value: expect.objectContaining({ operationType: OperationType.D }),
        }),
      );
      expect(mockKafkaService).toHaveBeenNthCalledWith(
        4,
        KAFKA_TOPICS.REPORT_OPERATION.CREATE,
        expect.objectContaining({
          value: expect.objectContaining({ operationType: OperationType.C }),
        }),
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
