import { createMock } from 'ts-auto-mock';
import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import { OperationRepository } from '@zro/operations/domain';
import {
  OperationModel,
  GetOperationByIdMicroserviceController as Controller,
  OperationDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { GetOperationByIdRequest } from '@zro/operations/interface';
import { OperationFactory } from '@zro/test/operations/config';

describe('GetOperationByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let operationRepository: OperationRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    operationRepository = new OperationDatabaseRepository();
  });

  describe('GetOperationById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get operation by id successfully', async () => {
        const { id, value, state } =
          await OperationFactory.create<OperationModel>(OperationModel.name);

        const message: GetOperationByIdRequest = {
          id,
        };

        const result = await controller.execute(
          operationRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.value).toBe(value);
        expect(result.value.state).toBe(state);
      });

      it('TC0002 - Should not get operation with incorrect id', async () => {
        const id = uuidV4();

        const message: GetOperationByIdRequest = {
          id,
        };

        const result = await controller.execute(
          operationRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
