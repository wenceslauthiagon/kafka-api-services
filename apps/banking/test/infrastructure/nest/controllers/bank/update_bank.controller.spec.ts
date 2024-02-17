import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { BankRepository } from '@zro/banking/domain';
import {
  BankModel,
  UpdateBankMicroserviceController as Controller,
  BankDatabaseRepository,
  BankEventKafkaEmitter,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankNotFoundException } from '@zro/banking/application';
import {
  BankEventEmitterControllerInterface,
  BankEventType,
  UpdateBankRequest,
} from '@zro/banking/interface';
import { BankFactory } from '@zro/test/banking/config';
import { KafkaContext } from '@nestjs/microservices';

describe('UpdateBankMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankRepository: BankRepository;

  const bankEventService: BankEventEmitterControllerInterface =
    createMock<BankEventEmitterControllerInterface>();
  const mockEmitBankEvent: jest.Mock = On(bankEventService).get(
    method((mock) => mock.emitBankEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(BankEventKafkaEmitter)
      .useValue(bankEventService)
      .compile();
    controller = module.get<Controller>(Controller);
    bankRepository = new BankDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('UpdateBank', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update bank successfully, when bank is inactive', async () => {
        const { id } = await BankFactory.create<BankModel>(BankModel.name, {
          active: false,
        });
        const active = true;

        const message: UpdateBankRequest = {
          id,
          active,
        };

        const result = await controller.execute(
          bankRepository,
          bankEventService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.active).toBe(active);
        expect(mockEmitBankEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitBankEvent.mock.calls[0][0]).toBe(BankEventType.UPDATED);
      });

      it('TC0002 - Should update bank successfully, when bank is active', async () => {
        const { id } = await BankFactory.create<BankModel>(BankModel.name, {
          active: true,
        });
        const active = false;

        const message: UpdateBankRequest = {
          id,
          active,
        };

        const result = await controller.execute(
          bankRepository,
          bankEventService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.active).toBe(active);
        expect(mockEmitBankEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitBankEvent.mock.calls[0][0]).toBe(BankEventType.UPDATED);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not update bank when bank is not found', async () => {
        const id = uuidV4();

        const message: UpdateBankRequest = {
          id,
          active: false,
        };

        const testScript = () =>
          controller.execute(
            bankRepository,
            bankEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(BankNotFoundException);
        expect(mockEmitBankEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not update bank successfully, when active is undefined', async () => {
        const id = uuidV4();

        const message: UpdateBankRequest = {
          id,
          active: undefined,
        };

        const testScript = () =>
          controller.execute(
            bankRepository,
            bankEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitBankEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should not update bank successfully, when active is null', async () => {
        const id = uuidV4();

        const message: UpdateBankRequest = {
          id,
          active: null,
        };

        const testScript = () =>
          controller.execute(
            bankRepository,
            bankEventService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitBankEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
