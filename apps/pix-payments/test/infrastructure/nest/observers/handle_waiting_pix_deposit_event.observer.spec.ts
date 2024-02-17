import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  InvalidDataFormatException,
  RedisKey,
  RedisService,
  defaultLogger as logger,
} from '@zro/common';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDepositState,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import { WarningDepositChecker } from '@zro/pix-payments/application';
import {
  WaitingPixDepositNestObserver as Observer,
  ComplianceServiceKafka,
  WarningPixDepositDatabaseRepository,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  HandleWaitingPixDepositEventRequest,
  PixDepositEventEmitterControllerInterface,
  WarningPixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

describe('WaitingPixDepositNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let pixDepositRepository: PixDepositRepository;
  let warningPixDepositRepository: WarningPixDepositRepository;

  const redisService: RedisService = createMock<RedisService>();
  const mockGetRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.get),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockCreateOperation: jest.Mock = On(operationService).get(
    method((mock) => mock.createOperation),
  );
  const mockCreateAndAcceptOperation: jest.Mock = On(operationService).get(
    method((mock) => mock.createAndAcceptOperation),
  );

  const complianceService: ComplianceServiceKafka =
    createMock<ComplianceServiceKafka>();
  const mockCreateWarningTransaction: jest.Mock = On(complianceService).get(
    method((mock) => mock.createWarningTransaction),
  );

  const warningPixDepositEventEmitter: WarningPixDepositEventEmitterControllerInterface =
    createMock<WarningPixDepositEventEmitterControllerInterface>();
  const mockWarningPixDepositEvent: jest.Mock = On(
    warningPixDepositEventEmitter,
  ).get(method((mock) => mock.emitWarningPixDepositEvent));

  const pixDepositEventEmitter: PixDepositEventEmitterControllerInterface =
    createMock<PixDepositEventEmitterControllerInterface>();
  const mockPixDepositEvent: jest.Mock = On(pixDepositEventEmitter).get(
    method((mock) => mock.emitDepositEvent),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();

    controller = module.get<Observer>(Observer);
    pixDepositRepository = new PixDepositDatabaseRepository();
    warningPixDepositRepository = new WarningPixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle create a warning pix deposit and warning transaction successfully', async () => {
      let i = WarningDepositChecker.checkers;
      const result = [true, false];
      const check = {};

      while (i > 0) {
        const checkName = faker.lorem.words(1);
        check[checkName] = result[Math.round(Math.random())];

        i--;
      }

      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { state: PixDepositState.WAITING, check },
      );

      const key: RedisKey = { key: `pix_deposit:id:${data.id}`, data, ttl: 1 };

      mockGetRedisService.mockResolvedValue(key);

      const message: HandleWaitingPixDepositEventRequest = {
        id: data.id,
        userId: data.user.uuid,
        walletId: data.wallet.uuid,
        state: data.state,
        amount: data.amount,
        thirdPartName: data.thirdPartName,
      };

      await controller.execute(
        message,
        pixDepositRepository,
        warningPixDepositRepository,
        operationService,
        complianceService,
        warningPixDepositEventEmitter,
        pixDepositEventEmitter,
        logger,
      );

      expect(mockWarningPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should handle receive pix deposit and create and accept operation successfully', async () => {
      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          check: {
            isCEF: true,
            isSantanter: true,
            isDuplicated: true,
            isOverWarningIncome: true,
          },
        },
      );

      const key: RedisKey = { key: `pix_deposit:id:${data.id}`, data, ttl: 1 };

      mockGetRedisService.mockResolvedValue(key);

      const message: HandleWaitingPixDepositEventRequest = {
        id: data.id,
        userId: data.user.uuid,
        walletId: data.wallet.uuid,
        state: data.state,
        amount: data.amount,
        thirdPartName: data.thirdPartName,
      };

      await controller.execute(
        message,
        pixDepositRepository,
        warningPixDepositRepository,
        operationService,
        complianceService,
        warningPixDepositEventEmitter,
        pixDepositEventEmitter,
        logger,
      );

      expect(mockWarningPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should handle receive pix deposit without checks and create and accept operation successfully', async () => {
      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { state: PixDepositState.WAITING },
      );

      const key: RedisKey = { key: `pix_deposit:id:${data.id}`, data, ttl: 1 };

      mockGetRedisService.mockResolvedValue(key);

      const message: HandleWaitingPixDepositEventRequest = {
        id: data.id,
        userId: data.user.uuid,
        walletId: data.wallet.uuid,
        state: data.state,
        amount: data.amount,
        thirdPartName: data.thirdPartName,
      };

      await controller.execute(
        message,
        pixDepositRepository,
        warningPixDepositRepository,
        operationService,
        complianceService,
        warningPixDepositEventEmitter,
        pixDepositEventEmitter,
        logger,
      );

      expect(mockWarningPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should not update pix deposit when state is already received', async () => {
      const data = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { state: PixDepositState.RECEIVED },
      );

      const key: RedisKey = { key: `pix_deposit:id:${data.id}`, data, ttl: 1 };

      mockGetRedisService.mockResolvedValue(key);

      const message: HandleWaitingPixDepositEventRequest = {
        id: data.id,
        userId: data.user.uuid,
        walletId: data.wallet.uuid,
        state: data.state,
        amount: data.amount,
        thirdPartName: data.thirdPartName,
      };

      await controller.execute(
        message,
        pixDepositRepository,
        warningPixDepositRepository,
        operationService,
        complianceService,
        warningPixDepositEventEmitter,
        pixDepositEventEmitter,
        logger,
      );

      expect(mockWarningPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should fail when missing params', async () => {
      const message: HandleWaitingPixDepositEventRequest = {
        id: null,
        userId: faker.datatype.uuid(),
        walletId: faker.datatype.uuid(),
        state: PixDepositState.WAITING,
        amount: faker.datatype.number(100000),
      };

      const testScript = () =>
        controller.execute(
          message,
          pixDepositRepository,
          warningPixDepositRepository,
          operationService,
          complianceService,
          warningPixDepositEventEmitter,
          pixDepositEventEmitter,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockWarningPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockPixDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
