import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { OperationFactory } from '@zro/test/operations/config';
import { OperationRepository } from '@zro/operations/domain';
import { GetOperationByIdUseCase as UseCase } from '@zro/operations/application';
import {
  OperationDatabaseRepository,
  OperationModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';

/**
 * Test get operation by id use case.
 */
describe('Testing create operation use case.', () => {
  let module: TestingModule;
  let operationRepository: OperationRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    operationRepository = new OperationDatabaseRepository();
  });

  describe('Get operation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get an operation successfully', async () => {
        const operation = await OperationFactory.create<OperationModel>(
          OperationModel.name,
        );
        const usecase = new UseCase(logger, operationRepository);

        const result = await usecase.execute(operation.id);

        expect(result).toBeDefined();
        expect(result).toMatchObject(operation.toDomain());
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get operation with invalid id', async () => {
        const usecase = new UseCase(logger, operationRepository);

        const result = await usecase.execute(uuidV4());

        expect(result).toBeNull();
      });

      it('TC0003 - Should not get operation without id', async () => {
        const usecase = new UseCase(logger, operationRepository);

        const testScript = () => usecase.execute(null);

        await expect(testScript).rejects.toThrow(MissingDataException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
