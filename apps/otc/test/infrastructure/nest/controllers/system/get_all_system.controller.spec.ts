import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { SystemRepository } from '@zro/otc/domain';
import {
  SystemModel,
  GetAllSystemMicroserviceController as Controller,
  SystemDatabaseRepository,
  GetAllSystemRequestDto,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SystemFactory } from '@zro/test/otc/config';
import {
  GetAllSystemRequest,
  GetAllSystemRequestSort,
} from '@zro/otc/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllSystemMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let systemRepository: SystemRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    systemRepository = new SystemDatabaseRepository();
  });

  describe('GetAllSystem', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get systems successfully', async () => {
        await SystemFactory.createMany<SystemModel>(SystemModel.name, 5);

        const pagination = new PaginationEntity();

        const system = new GetAllSystemRequestDto(pagination);

        const message: GetAllSystemRequest = {
          order: system.order,
          page: system.page,
          pageSize: system.pageSize,
          sort: system.sort,
        };

        const result = await controller.execute(
          systemRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBe(pagination.page);
        expect(result.value.pageSize).toBe(pagination.pageSize);
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0002 - Should get systems successfully with pagination sort', async () => {
        await SystemFactory.createMany<SystemModel>(SystemModel.name, 5);

        const message: GetAllSystemRequest = {
          sort: GetAllSystemRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          systemRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBeDefined();
        expect(result.value.pageSize).toBeDefined();
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
