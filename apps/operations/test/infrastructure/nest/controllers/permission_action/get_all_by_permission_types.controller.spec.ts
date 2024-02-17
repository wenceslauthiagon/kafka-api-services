import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { PermissionActionRepository } from '@zro/operations/domain';
import { GetAllPermissionActionByPermissionTypesRequest } from '@zro/operations/interface';
import {
  GetAllPermissionActionByPermissionTypesMicroserviceController as Controller,
  PermissionActionDatabaseRepository,
  PermissionTypeActionModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { PermissionTypeActionFactory } from '@zro/test/operations/config';

describe('GetAllPermissionActionByPermissionTypesMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let permissionActionRepository: PermissionActionRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    permissionActionRepository = new PermissionActionDatabaseRepository();
  });

  describe('PermissionActionByPermissionTypes', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get permissionActions successfully', async () => {
        const message: GetAllPermissionActionByPermissionTypesRequest = {};

        const result = await controller.execute(
          permissionActionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.total).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.data.forEach((item) => {
          expect(item.id).toBeDefined();
          expect(item.tag).toBeDefined();
        });
      });

      it('TC0002 - Should get permissionActions by permissionType successfully', async () => {
        const permission =
          await PermissionTypeActionFactory.create<PermissionTypeActionModel>(
            PermissionTypeActionModel.name,
          );

        const message: GetAllPermissionActionByPermissionTypesRequest = {
          permissionTypeTags: [permission.permissionTypeTag],
        };

        const result = await controller.execute(
          permissionActionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.total).toBe(1);
        expect(result.value).toBeDefined();
        result.value.data.forEach((item) => {
          expect(item.id).toBeDefined();
          expect(item.tag).toBe(permission.permissionActionTag);
        });
      });

      it('TC0003 - Should get permissionActions by duplicate permissionAction successfully', async () => {
        const permissionFirst =
          await PermissionTypeActionFactory.create<PermissionTypeActionModel>(
            PermissionTypeActionModel.name,
          );
        const permissionSecond =
          await PermissionTypeActionFactory.create<PermissionTypeActionModel>(
            PermissionTypeActionModel.name,
            { permissionActionTag: permissionFirst.permissionActionTag },
          );

        const message: GetAllPermissionActionByPermissionTypesRequest = {
          permissionTypeTags: [
            permissionFirst.permissionTypeTag,
            permissionSecond.permissionTypeTag,
          ],
        };

        const result = await controller.execute(
          permissionActionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.total).toBe(2);
        expect(result.value).toBeDefined();
        result.value.data.forEach((item) => {
          expect(item.id).toBeDefined();
          expect(item.tag).toBe(permissionFirst.permissionActionTag);
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0004 - Should not get permissionActions with invalid type tag', async () => {
        const message: GetAllPermissionActionByPermissionTypesRequest = {
          permissionTypeTags: [12345] as unknown as string[],
        };

        const testScript = () =>
          controller.execute(permissionActionRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0005 - Should not get permissionActions by duplicate type tag', async () => {
        const permission =
          await PermissionTypeActionFactory.create<PermissionTypeActionModel>(
            PermissionTypeActionModel.name,
          );

        const message: GetAllPermissionActionByPermissionTypesRequest = {
          permissionTypeTags: [
            permission.permissionTypeTag,
            permission.permissionTypeTag,
          ],
        };

        const testScript = () =>
          controller.execute(permissionActionRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
