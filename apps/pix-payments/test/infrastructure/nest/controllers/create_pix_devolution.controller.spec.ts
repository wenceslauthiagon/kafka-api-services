import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixDepositNotFoundException } from '@zro/pix-payments/application';
import {
  PixDepositRepository,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  CreatePixDevolutionMicroserviceController as Controller,
  PixDevolutionDatabaseRepository,
  PixDepositModel,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  CreatePixDevolutionRequest,
  PixDevolutionEventEmitterControllerInterface,
  PixDevolutionEventType,
} from '@zro/pix-payments/interface';
import { PixDepositFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';

describe('CreatePixDevolutionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let devolutionRepository: PixDevolutionRepository;
  let depositRepository: PixDepositRepository;

  const eventEmitter: PixDevolutionEventEmitterControllerInterface =
    createMock<PixDevolutionEventEmitterControllerInterface>();
  const mockEmitDevolutionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitDevolutionEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    devolutionRepository = new PixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateDevolution', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create with invalid amount', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const message: CreatePixDevolutionRequest = {
          id: faker.datatype.uuid(),
          walletId: deposit.walletId,
          userId: deposit.userId,
          operationId: deposit.operationId,
          amount: 0,
        };

        const testScript = () =>
          controller.execute(
            devolutionRepository,
            depositRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not create without id', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        const message: CreatePixDevolutionRequest = {
          id: null,
          walletId: deposit.walletId,
          userId: deposit.userId,
          operationId: deposit.operationId,
          amount: deposit.amount,
        };

        const testScript = () =>
          controller.execute(
            devolutionRepository,
            depositRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not create if operation is not found', async () => {
        const message: CreatePixDevolutionRequest = {
          id: faker.datatype.uuid(),
          walletId: faker.datatype.uuid(),
          userId: faker.datatype.uuid(),
          operationId: faker.datatype.uuid(),
          amount: 1,
        };

        const testScript = () =>
          controller.execute(
            devolutionRepository,
            depositRepository,
            eventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixDepositNotFoundException);
        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0004 - Should create devolution successfully', async () => {
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
          { createdAt: new Date() },
        );

        const message: CreatePixDevolutionRequest = {
          id: faker.datatype.uuid(),
          walletId: deposit.walletId,
          userId: deposit.userId,
          operationId: deposit.operationId,
          amount: deposit.amount,
        };

        const result = await controller.execute(
          devolutionRepository,
          depositRepository,
          eventEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.amount).toBe(deposit.amount);
        expect(result.value.state).toBe(PixDevolutionState.PENDING);
        expect(result.value.createdAt).toBeDefined();

        expect(mockEmitDevolutionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitDevolutionEvent.mock.calls[0][0]).toBe(
          PixDevolutionEventType.PENDING,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
