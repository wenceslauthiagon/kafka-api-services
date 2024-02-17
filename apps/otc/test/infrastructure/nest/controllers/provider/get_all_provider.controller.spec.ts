import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { ProviderRepository } from '@zro/otc/domain';
import {
  ProviderModel,
  GetAllProviderMicroserviceController as Controller,
  ProviderDatabaseRepository,
  GetAllProviderRequestDto,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ProviderFactory } from '@zro/test/otc/config';
import {
  GetAllProviderRequest,
  GetAllProviderRequestSort,
} from '@zro/otc/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllProviderMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let providerRepository: ProviderRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    providerRepository = new ProviderDatabaseRepository();
  });

  describe('GetAllProvider', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get providers successfully', async () => {
        await ProviderFactory.createMany<ProviderModel>(ProviderModel.name, 5);

        const pagination = new PaginationEntity();

        const provider = new GetAllProviderRequestDto(pagination);

        const message: GetAllProviderRequest = {
          order: provider.order,
          page: provider.page,
          pageSize: provider.pageSize,
          sort: provider.sort,
        };

        const result = await controller.execute(
          providerRepository,
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

      it('TC0002 - Should get providers successfully with pagination sort', async () => {
        await ProviderFactory.createMany<ProviderModel>(ProviderModel.name, 5);

        const message: GetAllProviderRequest = {
          sort: GetAllProviderRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          providerRepository,
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
