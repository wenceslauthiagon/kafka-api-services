import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  RedisService,
  defaultLogger as logger,
  RedisKey,
  KafkaService,
} from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import { WalletAccountEntity } from '@zro/operations/domain';
import {
  PixDepositEntity,
  PixDepositState,
  WarningPixSkipListEntity,
  WarningPixSkipListRepository,
} from '@zro/pix-payments/domain';
import {
  BankNotFoundException,
  PixDepositReceivedAccountNotFoundException,
} from '@zro/pix-payments/application';
import {
  ReceivePixDepositMicroserviceController as Controller,
  OperationServiceKafka,
  BankingServiceKafka,
  WarningPixSkipListDatabaseRepository,
  WarningPixSkipListModel,
  KAFKA_EVENTS,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDepositEventEmitterControllerInterface,
  PixDepositEventType,
  ReceivePixDepositRequest,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  WarningPixSkipListFactory,
} from '@zro/test/pix-payments/config';
import { BankFactory } from '@zro/test/banking/config';
import { WalletAccountFactory } from '@zro/test/operations/config';

const APP_ZROBANK_ISPB = '26264220';

describe('ReceivePixDepositMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let warningPixSkipListRepository: WarningPixSkipListRepository;

  const redisService: RedisService = createMock<RedisService>();
  const mockGetRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.get),
  );

  const eventEmitter: PixDepositEventEmitterControllerInterface =
    createMock<PixDepositEventEmitterControllerInterface>();
  const mockEmitPixDepositEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDepositEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetAccountOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getWalletAccountByAccountNumberAndCurrency),
  );

  const bankingService: BankingServiceKafka = createMock<BankingServiceKafka>();
  const mockGetBankingService: jest.Mock = On(bankingService).get(
    method((mock) => mock.getBankByIspb),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockEmitkafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.emit),
  );
  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();

    controller = module.get<Controller>(Controller);
    warningPixSkipListRepository = new WarningPixSkipListDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if deposit already exists', async () => {
      const zrobank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: APP_ZROBANK_ISPB,
      });

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          clientBank: zrobank,
          thirdPartBank: zrobank,
        },
      );

      const key: RedisKey = { key: `pix_deposit:id:${data.id}`, data, ttl: 1 };
      mockGetRedisService.mockResolvedValueOnce(key);

      const message: ReceivePixDepositRequest = {
        id: data.id,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBank.ispb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBank.ispb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };

      const result = await controller.execute(
        message,
        eventEmitter,
        operationService,
        bankingService,
        warningPixSkipListRepository,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(data.id);
      expect(result.value.state).toBe(data.state);
      expect(mockGetBankingService).toHaveBeenCalledTimes(0);
      expect(mockGetAccountOperationService).toHaveBeenCalledTimes(0);
      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should emit NEW_FAILED event if receives PixDepositReceivedAccountNotFoundException', async () => {
      const zrobank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: APP_ZROBANK_ISPB,
      });

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          clientBank: zrobank,
          thirdPartBank: zrobank,
        },
      );

      const key: RedisKey = {
        key: `pix_deposit:id:${data.id}`,
        data: null,
        ttl: 1,
      };

      mockGetRedisService.mockResolvedValueOnce(key);
      mockGetBankingService.mockResolvedValue(zrobank);
      mockGetAccountOperationService.mockResolvedValue(null);

      const message: ReceivePixDepositRequest = {
        id: data.id,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBank.ispb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBank.ispb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };

      const testScript = () =>
        controller.execute(
          message,
          eventEmitter,
          operationService,
          bankingService,
          warningPixSkipListRepository,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(
        PixDepositReceivedAccountNotFoundException,
      );
      expect(mockGetBankingService).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOperationService).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
      expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
        KAFKA_EVENTS.PIX_DEPOSIT.NEW_FAILED,
      );
    });

    it('TC0003 - Should emit NEW_FAILED event if receives BankNotFoundException', async () => {
      const zrobank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: APP_ZROBANK_ISPB,
      });

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          clientBank: zrobank,
        },
      );

      const key: RedisKey = {
        key: `pix_deposit:id:${data.id}`,
        data: null,
        ttl: 1,
      };

      mockGetRedisService.mockResolvedValueOnce(key);
      mockGetBankingService.mockResolvedValue(null);

      const message: ReceivePixDepositRequest = {
        id: data.id,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBank.ispb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBank.ispb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };

      const testScript = () =>
        controller.execute(
          message,
          eventEmitter,
          operationService,
          bankingService,
          warningPixSkipListRepository,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(BankNotFoundException);
      expect(mockGetBankingService).toHaveBeenCalledTimes(1);
      expect(mockGetAccountOperationService).toHaveBeenCalledTimes(0);
      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockEmitkafkaService).toHaveBeenCalledTimes(1);
      expect(mockEmitkafkaService.mock.calls[0][0]).toBe(
        KAFKA_EVENTS.PIX_DEPOSIT.NEW_FAILED,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should create new received deposit successfully, skip its checks, and emit waiting deposit', async () => {
      const zrobank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: APP_ZROBANK_ISPB,
      });

      const wallet = await WalletAccountFactory.create<WalletAccountEntity>(
        WalletAccountEntity.name,
        {},
      );

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          clientBank: zrobank,
          thirdPartBank: zrobank,
        },
      );

      const key: RedisKey = {
        key: `pix_deposit:id:${data.id}`,
        data: null,
        ttl: 1,
      };
      mockGetRedisService.mockResolvedValueOnce(key);

      const message: ReceivePixDepositRequest = {
        id: data.id,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBank.ispb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBank.ispb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };
      mockGetAccountOperationService.mockResolvedValue(wallet);
      mockGetBankingService.mockResolvedValue(zrobank);

      const warningPixSkipList =
        await WarningPixSkipListFactory.create<WarningPixSkipListEntity>(
          WarningPixSkipListEntity.name,
          {
            clientAccountNumber: data.clientAccountNumber,
            user: data.user,
          },
        );

      const skipKey: RedisKey = {
        key: `warning_pix_skip_list:clientAccountNumber:${warningPixSkipList.clientAccountNumber}`,
        data: warningPixSkipList,
        ttl: 1,
      };

      mockGetRedisService.mockResolvedValueOnce(skipKey);

      const result = await controller.execute(
        message,
        eventEmitter,
        operationService,
        bankingService,
        warningPixSkipListRepository,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(data.id);
      expect(result.value.state).toBe(PixDepositState.NEW);
      expect(mockGetBankingService).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOperationService).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDepositEvent.mock.calls[0][0]).toBe(
        PixDepositEventType.WAITING,
      );
    });

    it('TC0005 - Should create new received deposit successfully, skip its checks, and emit waiting deposit', async () => {
      const zrobank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: APP_ZROBANK_ISPB,
      });

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          clientBank: zrobank,
          thirdPartBank: zrobank,
        },
      );

      const wallet = await WalletAccountFactory.create<WalletAccountEntity>(
        WalletAccountEntity.name,
        {},
      );

      const key: RedisKey = {
        key: `pix_deposit:id:${data.id}`,
        data: null,
        ttl: 1,
      };
      mockGetRedisService.mockResolvedValueOnce(key);

      const message: ReceivePixDepositRequest = {
        id: data.id,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBank.ispb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBank.ispb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };
      mockGetAccountOperationService.mockResolvedValue(wallet);
      mockGetBankingService.mockResolvedValue(zrobank);

      const warningPixSkipList =
        await WarningPixSkipListFactory.create<WarningPixSkipListModel>(
          WarningPixSkipListModel.name,
          {
            clientAccountNumber: data.clientAccountNumber,
            userId: data.user.uuid,
          },
        );

      const skipKey: RedisKey = {
        key: `warning_pix_skip_list:clientAccountNumber:${warningPixSkipList.clientAccountNumber}`,
        data: null,
        ttl: 1,
      };

      mockGetRedisService.mockResolvedValueOnce(skipKey);

      const result = await controller.execute(
        message,
        eventEmitter,
        operationService,
        bankingService,
        warningPixSkipListRepository,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();

      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(data.id);
      expect(result.value.state).toBe(PixDepositState.NEW);
      expect(mockGetBankingService).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOperationService).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDepositEvent.mock.calls[0][0]).toBe(
        PixDepositEventType.WAITING,
      );
    });

    it('TC0006 - Should create new received deposit successfully, start its checks, and emit new deposit', async () => {
      const zrobank = await BankFactory.create<BankEntity>(BankEntity.name, {
        ispb: APP_ZROBANK_ISPB,
      });

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          clientBank: zrobank,
          thirdPartBank: zrobank,
        },
      );

      const wallet = await WalletAccountFactory.create<WalletAccountEntity>(
        WalletAccountEntity.name,
        {},
      );

      const key: RedisKey = {
        key: `pix_deposit:id:${data.id}`,
        data: null,
        ttl: 1,
      };
      mockGetRedisService.mockResolvedValueOnce(key);

      const message: ReceivePixDepositRequest = {
        id: data.id,
        amount: data.amount,
        txId: data.txId,
        endToEndId: data.endToEndId,
        clientBankIspb: data.clientBank.ispb,
        clientBranch: data.clientBranch,
        clientAccountNumber: data.clientAccountNumber,
        clientDocument: data.clientDocument,
        clientName: data.clientName,
        clientKey: data.clientKey,
        thirdPartBankIspb: data.thirdPartBank.ispb,
        thirdPartBranch: data.thirdPartBranch,
        thirdPartAccountType: data.thirdPartAccountType,
        thirdPartAccountNumber: data.thirdPartAccountNumber,
        thirdPartDocument: data.thirdPartDocument,
        thirdPartName: data.thirdPartName,
        thirdPartKey: data.thirdPartKey,
        description: data.description,
      };
      mockGetAccountOperationService.mockResolvedValue(wallet);
      mockGetBankingService.mockResolvedValue(zrobank);

      const warningPixSkipList =
        await WarningPixSkipListFactory.create<WarningPixSkipListEntity>(
          WarningPixSkipListEntity.name,
          {
            clientAccountNumber: data.clientAccountNumber,
            user: data.user,
          },
        );

      const skipKey: RedisKey = {
        key: `warning_pix_skip_list:clientAccountNumber:${warningPixSkipList.clientAccountNumber}`,
        data: null,
        ttl: 1,
      };

      mockGetRedisService.mockResolvedValueOnce(skipKey);

      const result = await controller.execute(
        message,
        eventEmitter,
        operationService,
        bankingService,
        warningPixSkipListRepository,
        logger,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.ctx).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.value.id).toBe(data.id);
      expect(result.value.state).toBe(PixDepositState.NEW);
      expect(mockGetBankingService).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOperationService).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitPixDepositEvent.mock.calls[0][0]).toBe(
        PixDepositEventType.NEW,
      );
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
