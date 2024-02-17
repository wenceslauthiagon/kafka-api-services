import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixDepositState,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { OperationEntity, OperationState } from '@zro/operations/domain';
import { GetWarningPixDevolutionByIdRequest } from '@zro/pix-payments/interface';
import {
  GetByWarningPixDevolutionMicroserviceIdRestController as Controller,
  PixDepositModel,
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { OperationFactory } from '@zro/test/operations/config';
import {
  PixDepositFactory,
  WarningPixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('GetByWarningPixDevolutionMicroserviceIdRestController', () => {
  let module: TestingModule;
  let controller: Controller;
  let devolutionRepository: WarningPixDevolutionRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    devolutionRepository = new WarningPixDevolutionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get by devolution id successfully', async () => {
      const devolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionModel>(
          WarningPixDevolutionModel.name,
        );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { state: OperationState.PENDING },
      );

      const pixDeposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { state: PixDepositState.WAITING, operationId: operation.id },
      );

      const message: GetWarningPixDevolutionByIdRequest = {
        id: devolution.id,
        userId: pixDeposit.userId,
      };

      const result = await controller.execute(
        devolutionRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException if missing devolutionId', async () => {
      const message: GetWarningPixDevolutionByIdRequest = {
        id: null,
      };

      const testScript = () =>
        controller.execute(devolutionRepository, logger, message, ctx);

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
    });

    it('TC0003 - Should return null if devolution not found', async () => {
      const message: GetWarningPixDevolutionByIdRequest = {
        id: uuidV4(),
      };

      const result = await controller.execute(
        devolutionRepository,
        logger,
        message,
        ctx,
      );

      expect(result).toBeDefined();
      expect(result.value).toBeNull();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
