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
  WarningPixDepositIsSuspectCpfNestObserver as Observer,
  WarningPixBlockListDatabaseRepository,
  WarningPixBlockListModel,
} from '@zro/pix-payments/infrastructure';
import {
  PixDepositEntity,
  PixDepositState,
  WarningPixBlockListRepository,
} from '@zro/pix-payments/domain';
import {
  HandleWarningPixDepositIsSuspectCpfEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  WarningPixBlockListFactory,
} from '@zro/test/pix-payments/config';

describe('WarningPixDepositIsSuspectCpfNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let warningPixBlockListRepository: WarningPixBlockListRepository;

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
    warningPixBlockListRepository = new WarningPixBlockListDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update pix deposit with missing params', async () => {
      const message: HandleWarningPixDepositIsSuspectCpfEventRequest = {
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
          warningPixBlockListRepository,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitDepositEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should update pix deposit check successfully but do not emit event since there are other checkers to check deposit.', async () => {
      const name = 'isSuspectCpf';
      const result = false;

      const checkResult = { [name]: result };

      const suspectCpf =
        await WarningPixBlockListFactory.create<WarningPixBlockListModel>(
          WarningPixBlockListModel.name,
          {},
        );

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          amount: 50000,
          thirdPartDocument: suspectCpf.cpf,
          check: checkResult,
        },
      );

      const key: RedisKey = { key: `pix_deposit:id:${data.id}`, data, ttl: 1 };
      mockSemaphoreRedisService.mockResolvedValueOnce(key);
      mockGetRedisService.mockResolvedValue(key);

      const message: HandleWarningPixDepositIsSuspectCpfEventRequest = {
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
        warningPixBlockListRepository,
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
