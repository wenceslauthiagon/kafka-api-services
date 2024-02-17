import { createMock } from 'ts-auto-mock';
import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { OperationRepository } from '@zro/operations/domain';
import { OperationNotFoundException } from '@zro/operations/application';
import {
  OperationModel,
  SetOperationReferenceByIdMicroserviceController as Controller,
  OperationDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { OperationFactory } from '@zro/test/operations/config';
import { SetOperationReferenceByIdRequest } from '@zro/operations/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('SetOperationReferenceByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let operationRepository: OperationRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    operationRepository = new OperationDatabaseRepository();
  });

  describe('SetReferenceById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should set operation reference by id successfully', async () => {
        const operationFirst = await OperationFactory.create<OperationModel>(
          OperationModel.name,
        );
        const operationSecond = await OperationFactory.create<OperationModel>(
          OperationModel.name,
        );

        const message: SetOperationReferenceByIdRequest = {
          operationIdFirst: operationFirst.id,
          operationIdSecond: operationSecond.id,
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
        expect(result.value.operationFirst).toBeDefined();
        expect(result.value.operationSecond).toBeDefined();
        expect(result.value.operationFirst.id).toBe(operationFirst.id);
        expect(result.value.operationFirst.state).toBe(operationFirst.state);
        expect(result.value.operationSecond.id).toBe(operationSecond.id);
        expect(result.value.operationSecond.state).toBe(operationSecond.state);
        expect(result.value.operationFirst.operationRefId).toBe(
          operationSecond.id,
        );
        expect(result.value.operationSecond.operationRefId).toBe(
          operationFirst.id,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not set operation with invalid id', async () => {
        const message: SetOperationReferenceByIdRequest = {
          operationIdFirst: uuidV4(),
          operationIdSecond: uuidV4(),
        };

        const testScript = () =>
          controller.execute(operationRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(OperationNotFoundException);
      });

      it('TC0003 - Should not set operation without id', async () => {
        const message: SetOperationReferenceByIdRequest = {
          operationIdFirst: null,
          operationIdSecond: null,
        };

        const testScript = () =>
          controller.execute(operationRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
