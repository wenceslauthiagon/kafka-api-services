import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  RedisKey,
  RedisService,
  defaultLogger as logger,
} from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import { PixDepositEntity, PixDepositState } from '@zro/pix-payments/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { WarningPixDepositIsSantanderCnpjNestObserver as Observer } from '@zro/pix-payments/infrastructure';
import {
  HandleWarningPixDepositIsSantanderCnpjEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

const pixPaymentSantanderIspb = '90400888';
const warningPixDepositSantanderCnpj = '90400888000142';

describe('WarningPixDepositIsSantanderCnpjNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;

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
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update pix deposit with missing params', async () => {
      const message: HandleWarningPixDepositIsSantanderCnpjEventRequest = {
        id: null,
        state: null,
        userId: null,
        walletId: null,
        amount: null,
        thirdPartName: null,
      };

      const testScript = () =>
        controller.execute(message, eventEmitter, logger);

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitDepositEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should update pix deposit check successfully but do not emit event since there are other checkers to check deposit.', async () => {
      const name = 'isSantander';
      const result = false;

      const checkResult = { [name]: result };

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.NEW,
          amount: 50000,
          thirdPartBank: new BankEntity({
            ispb: pixPaymentSantanderIspb,
          }),
          thirdPartDocument: warningPixDepositSantanderCnpj,
          check: checkResult,
        },
      );

      const key: RedisKey = { key: `pix_deposit:id:${data.id}`, data, ttl: 1 };
      mockSemaphoreRedisService.mockResolvedValueOnce(key);
      mockGetRedisService.mockResolvedValue(key);

      const message: HandleWarningPixDepositIsSantanderCnpjEventRequest = {
        id: data.id,
        state: data.state,
        userId: data.user.uuid,
        walletId: data.wallet.uuid,
        amount: data.amount,
        thirdPartName: data.thirdPartName,
      };

      await controller.execute(message, eventEmitter, logger);

      expect(mockEmitDepositEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
