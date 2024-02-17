import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  RejectAdminBankingTedMicroserviceController as Controller,
  AdminBankingTedDatabaseRepository,
  AdminBankingTedModel,
} from '@zro/banking/infrastructure';
import { AdminBankingTedFactory } from '@zro/test/banking/config';
import {
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  AdminBankingTedEventEmitterControllerInterface,
  RejectAdminBankingTedRequest,
} from '@zro/banking/interface';
import {
  AdminBankingTedInvalidStateException,
  AdminBankingTedNotFoundException,
} from '@zro/banking/application';
import { KafkaContext } from '@nestjs/microservices';

describe('RejectAdminBankingTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let adminBankingTedRepository: AdminBankingTedRepository;

  const adminBankingTedEmitter: AdminBankingTedEventEmitterControllerInterface =
    createMock<AdminBankingTedEventEmitterControllerInterface>();
  const mockEmitAdminBankingTedConfirmeEvent: jest.Mock = On(
    adminBankingTedEmitter,
  ).get(method((mock) => mock.emitAdminBankingTedEvent));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<Controller>(Controller);
    adminBankingTedRepository = new AdminBankingTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('RejectAdminBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should reject successfully', async () => {
        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
            {
              state: AdminBankingTedState.FORWARDED,
            },
          );

        const message: RejectAdminBankingTedRequest = {
          id: adminBankingTed.id,
          failureCode: '0',
          failureMessage: 'Test message by failure',
        };

        const result = await controller.execute(
          adminBankingTedRepository,
          adminBankingTedEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.state).toBe(AdminBankingTedState.FAILED);
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitAdminBankingTedConfirmeEvent.mock.calls[0][0]).toBe(
          AdminBankingTedState.FAILED,
        );
      });

      it('TC0002 - Should reject successfully when admin bankig ted is already failed', async () => {
        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
            {
              state: AdminBankingTedState.FAILED,
            },
          );

        const message: RejectAdminBankingTedRequest = {
          id: adminBankingTed.id,
          failureCode: '0',
          failureMessage: 'Test message by failure',
        };

        const result = await controller.execute(
          adminBankingTedRepository,
          adminBankingTedEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.state).toBe(AdminBankingTedState.FAILED);
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should throw InvalidDataFormatException when invalid data format', async () => {
      await AdminBankingTedFactory.create<AdminBankingTedModel>(
        AdminBankingTedModel.name,
      );

      const message: RejectAdminBankingTedRequest = {
        id: null,
        failureCode: null,
        failureMessage: null,
      };

      const result = controller.execute(
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );
      await expect(result).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw AdminBankingTedNotFoundException when admin banking ted do not found', async () => {
      await AdminBankingTedFactory.create<AdminBankingTedModel>(
        AdminBankingTedModel.name,
        {
          state: AdminBankingTedState.FORWARDED,
        },
      );

      const message: RejectAdminBankingTedRequest = {
        id: faker.datatype.uuid(),
        failureCode: '0',
        failureMessage: 'Test message by failure',
      };

      const result = controller.execute(
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );

      await expect(result).rejects.toThrow(AdminBankingTedNotFoundException);
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw AdminBankingTedInvalidStateException when invalid state', async () => {
      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedModel>(
          AdminBankingTedModel.name,
        );
      const message: RejectAdminBankingTedRequest = {
        id: adminBankingTed.id,
        failureCode: '0',
        failureMessage: 'Test message by failure',
      };

      const result = controller.execute(
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );
      await expect(result).rejects.toThrow(
        AdminBankingTedInvalidStateException,
      );
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
