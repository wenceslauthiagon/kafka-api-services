import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
  DatabaseModule,
} from '@zro/common';
import {
  AdminBankingAccountFactory,
  AdminBankingTedFactory,
} from '@zro/test/banking/config';
import {
  AdminBankingAccountRepository,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  AdminBankingAccountNotFoundException,
  AdminBankingTedBetweenSameAccountException,
} from '@zro/banking/application';
import {
  AdminBankingTedEventEmitterControllerInterface,
  CreateAdminBankingTedRequest,
} from '@zro/banking/interface';
import {
  CreateAdminBankingTedMicroserviceController as Controller,
  AdminBankingTedDatabaseRepository,
  AdminBankingAccountDatabaseRepository,
  AdminBankingTedModel,
  AdminBankingAccountModel,
} from '@zro/banking/infrastructure';
import { AdminModel } from '@zro/admin/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { AdminFactory } from '@zro/test/admin/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateAdminBankingTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let adminBankingAccountRepository: AdminBankingAccountRepository;
  let adminBankingTedRepository: AdminBankingTedRepository;

  const adminBankingTedEmitter: AdminBankingTedEventEmitterControllerInterface =
    createMock<AdminBankingTedEventEmitterControllerInterface>();
  const mockEmitAdminBankingTedConfirmeEvent: jest.Mock = On(
    adminBankingTedEmitter,
  ).get(method((mock) => mock.emitAdminBankingTedEvent));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule.forFeature([AdminModel])],
    }).compile();
    controller = module.get<Controller>(Controller);
    adminBankingAccountRepository = new AdminBankingAccountDatabaseRepository();
    adminBankingTedRepository = new AdminBankingTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateAdminBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create successfully', async () => {
        const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
          );

        const { sourceId, destinationId, value, description } = adminBankingTed;

        const message: CreateAdminBankingTedRequest = {
          id: faker.datatype.uuid(),
          adminId: admin.id,
          sourceId,
          destinationId,
          value,
          description,
        };

        const result = await controller.execute(
          adminBankingAccountRepository,
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
        expect(result.value.state).toBe(AdminBankingTedState.PENDING);
        expect(result.value.createdAt).toBeDefined();
        expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitAdminBankingTedConfirmeEvent.mock.calls[0][0]).toBe(
          AdminBankingTedState.PENDING,
        );
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when invalid data format', async () => {
      const adminAccountBankingTed =
        await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
          AdminBankingAccountModel.name,
        );

      await AdminBankingTedFactory.create<AdminBankingTedModel>(
        AdminBankingTedModel.name,
        {
          state: AdminBankingTedState.WAITING,
          destinationId: adminAccountBankingTed.id,
        },
      );

      const message: CreateAdminBankingTedRequest = {
        id: null,
        adminId: null,
        sourceId: null,
        destinationId: null,
        value: null,
        description: null,
      };

      const result = controller.execute(
        adminBankingAccountRepository,
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );

      await expect(result).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw AdminBankingTedBetweenSameAccountException when sourceId equal destinationId', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const adminAccountBankingTed =
        await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
          AdminBankingAccountModel.name,
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedModel>(
          AdminBankingTedModel.name,
          {
            sourceId: adminAccountBankingTed.id,
            destinationId: adminAccountBankingTed.id,
          },
        );

      const message: CreateAdminBankingTedRequest = {
        id: faker.datatype.uuid(),
        adminId: admin.id,
        sourceId: adminBankingTed.sourceId,
        destinationId: adminBankingTed.destinationId,
        value: adminBankingTed.value,
        description: adminBankingTed.description,
      };

      const result = controller.execute(
        adminBankingAccountRepository,
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );

      await expect(result).rejects.toThrow(
        AdminBankingTedBetweenSameAccountException,
      );
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw AdminBankingAccountNotFoundException when banking account do not found', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedModel>(
          AdminBankingTedModel.name,
          {
            state: AdminBankingTedState.WAITING,
          },
        );

      const message: CreateAdminBankingTedRequest = {
        id: faker.datatype.uuid(),
        adminId: admin.id,
        sourceId: faker.datatype.uuid(),
        destinationId: adminBankingTed.destinationId,
        value: adminBankingTed.value,
        description: adminBankingTed.description,
      };

      const result = controller.execute(
        adminBankingAccountRepository,
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );

      await expect(result).rejects.toThrow(
        AdminBankingAccountNotFoundException,
      );
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw AdminBankingAccountNotActiveException when banking account do not active', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const adminAccountBankingTed =
        await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
          AdminBankingAccountModel.name,
          {
            enabled: false,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedModel>(
          AdminBankingTedModel.name,
          {
            sourceId: adminAccountBankingTed.id,
            state: AdminBankingTedState.WAITING,
          },
        );

      const message: CreateAdminBankingTedRequest = {
        id: faker.datatype.uuid(),
        adminId: admin.id,
        sourceId: adminBankingTed.sourceId,
        destinationId: adminBankingTed.destinationId,
        value: adminBankingTed.value,
        description: adminBankingTed.description,
      };

      const result = controller.execute(
        adminBankingAccountRepository,
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );

      await expect(result).rejects.toThrow(
        AdminBankingAccountNotFoundException,
      );
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw AdminBankingAccountNotFoundException when destination account do not found', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const adminAccountBankingTed =
        await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
          AdminBankingAccountModel.name,
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedModel>(
          AdminBankingTedModel.name,
          {
            state: AdminBankingTedState.WAITING,
          },
        );

      const message: CreateAdminBankingTedRequest = {
        id: faker.datatype.uuid(),
        adminId: admin.id,
        sourceId: adminAccountBankingTed.id,
        destinationId: faker.datatype.uuid(),
        value: adminBankingTed.value,
        description: adminBankingTed.description,
      };

      const result = controller.execute(
        adminBankingAccountRepository,
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );

      await expect(result).rejects.toThrow(
        AdminBankingAccountNotFoundException,
      );
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should throw AdminBankingAccountNotActiveException when destination account do not active', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const adminAccountBankingTed =
        await AdminBankingAccountFactory.create<AdminBankingAccountModel>(
          AdminBankingAccountModel.name,
          {
            enabled: false,
          },
        );

      const adminBankingTed =
        await AdminBankingTedFactory.create<AdminBankingTedModel>(
          AdminBankingTedModel.name,
          {
            destinationId: adminAccountBankingTed.id,
            state: AdminBankingTedState.WAITING,
          },
        );

      const message: CreateAdminBankingTedRequest = {
        id: faker.datatype.uuid(),
        adminId: admin.id,
        sourceId: adminBankingTed.sourceId,
        destinationId: adminBankingTed.destinationId,
        value: adminBankingTed.value,
        description: adminBankingTed.description,
      };

      const result = controller.execute(
        adminBankingAccountRepository,
        adminBankingTedRepository,
        adminBankingTedEmitter,
        logger,
        message,
        ctx,
      );

      await expect(result).rejects.toThrow(
        AdminBankingAccountNotFoundException,
      );
      expect(mockEmitAdminBankingTedConfirmeEvent).toHaveBeenCalledTimes(0);
    });
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
