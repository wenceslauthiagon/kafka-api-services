import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  RedisKey,
  RedisService,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  WarningPixDepositIsSuspectBankNestObserver as Observer,
  WarningPixDepositBankBlockListDatabaseRepository,
  WarningPixDepositBankBlockListModel,
} from '@zro/pix-payments/infrastructure';
import {
  PixDepositEntity,
  PixDepositState,
  WarningPixDepositBankBlockListRepository,
} from '@zro/pix-payments/domain';
import {
  HandleWarningPixDepositIsSuspectBankEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  WarningPixDepositBankBlockListFactory,
} from '@zro/test/pix-payments/config';

describe('WarningPixDepositIsSuspectBankNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let warningPixDepositBankBlockListRepository: WarningPixDepositBankBlockListRepository;

  const redisService: RedisService = createMock<RedisService>();
  const mockSemaphoreRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.semaphore),
  );
  const mockGetRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.get),
  );

  const eventEmitter: PixDepositEventEmitterControllerInterface =
    createMock<PixDepositEventEmitterControllerInterface>();
  const mockEmitDepositEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDepositEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();
    controller = module.get<Observer>(Observer);
    warningPixDepositBankBlockListRepository =
      new WarningPixDepositBankBlockListDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update pix deposit with missing params', async () => {
      const message: HandleWarningPixDepositIsSuspectBankEventRequest = {
        id: null,
        state: null,
        userId: null,
        walletId: null,
        amount: null,
        thirdPartName: null,
      };

      const testScript = () =>
        controller.execute(
          message,
          eventEmitter,
          warningPixDepositBankBlockListRepository,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitDepositEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should update pix deposit check successfully but do not emit event since there are other checkers to check deposit.', async () => {
      const name = 'isSuspectCnpj';
      const result = false;

      const checkResult = { [name]: result };

      const suspectCnpj =
        await WarningPixDepositBankBlockListFactory.create<WarningPixDepositBankBlockListModel>(
          WarningPixDepositBankBlockListModel.name,
        );

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          amount: 50000,
          thirdPartDocument: suspectCnpj.cnpj,
          check: checkResult,
        },
      );

      const keys: RedisKey = { key: `pix_deposit:id:${data.id}`, data, ttl: 1 };
      mockSemaphoreRedisService.mockResolvedValueOnce(keys);
      mockGetRedisService.mockResolvedValue(keys);

      const message: HandleWarningPixDepositIsSuspectBankEventRequest = {
        id: data.id,
        state: data.state,
        userId: data.user.uuid,
        walletId: data.wallet.uuid,
        amount: data.amount,
        thirdPartName: data.thirdPartName,
      };

      await controller.execute(
        message,
        eventEmitter,
        warningPixDepositBankBlockListRepository,
        logger,
      );

      expect(mockEmitDepositEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
