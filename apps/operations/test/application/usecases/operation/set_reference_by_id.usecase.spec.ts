import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { OperationFactory } from '@zro/test/operations/config';
import { OperationRepository } from '@zro/operations/domain';
import {
  SetOperationReferenceByIdUseCase as UseCase,
  OperationNotFoundException,
} from '@zro/operations/application';
import {
  OperationDatabaseRepository,
  OperationModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';

/**
 * Test set operation by id use case.
 */
describe('Testing set operation reference use case.', () => {
  let module: TestingModule;
  let operationRepository: OperationRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    operationRepository = new OperationDatabaseRepository();
  });

  describe('Set operation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should set operation reference by id successfully', async () => {
        const operationFirst = await OperationFactory.create<OperationModel>(
          OperationModel.name,
        );
        const operationSecond = await OperationFactory.create<OperationModel>(
          OperationModel.name,
        );

        const usecase = new UseCase(logger, operationRepository);

        const result = await usecase.execute(
          operationFirst.id,
          operationSecond.id,
        );

        expect(result).toBeDefined();
        expect(result.operationFirst).toBeDefined();
        expect(result.operationSecond).toBeDefined();
        expect(result.operationFirst.id).toBe(operationFirst.id);
        expect(result.operationFirst.state).toBe(operationFirst.state);
        expect(result.operationSecond.id).toBe(operationSecond.id);
        expect(result.operationSecond.state).toBe(operationSecond.state);
        expect(result.operationFirst.operationRef.id).toBe(operationSecond.id);
        expect(result.operationSecond.operationRef.id).toBe(operationFirst.id);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not set operation without id', async () => {
        const usecase = new UseCase(logger, operationRepository);

        const tests = [
          () => usecase.execute(null, null),
          () => usecase.execute(uuidV4(), null),
          () => usecase.execute(null, uuidV4()),
        ];

        for (const test of tests) {
          await expect(test).rejects.toThrow(MissingDataException);
        }
      });

      it('TC0003 - Should not set both operation with invalid id', async () => {
        const usecase = new UseCase(logger, operationRepository);

        const testScript = () => usecase.execute(uuidV4(), uuidV4());

        await expect(testScript).rejects.toThrow(OperationNotFoundException);
      });

      it('TC0004 - Should not set second operation without id', async () => {
        const operationFirst = await OperationFactory.create<OperationModel>(
          OperationModel.name,
        );

        const usecase = new UseCase(logger, operationRepository);

        const testScript = () => usecase.execute(operationFirst.id, uuidV4());

        await expect(testScript).rejects.toThrow(OperationNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
