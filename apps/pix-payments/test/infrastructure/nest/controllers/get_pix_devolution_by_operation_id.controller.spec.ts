import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  GetPixDevolutionByOperationIdMicroserviceController as Controller,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
  PixDepositDatabaseRepository,
  PixDepositModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { GetPixDevolutionByOperationIdRequest } from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('GetPixDevolutionByOperationIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let devolutionRepository: PixDevolutionRepository;
  let depositRepository: PixDepositRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    devolutionRepository = new PixDevolutionDatabaseRepository();
    depositRepository = new PixDepositDatabaseRepository();
  });

  describe('GetPixDevolutionByOperationId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get devolution successfully with operation and user', async () => {
        const userId = uuidV4();
        const operationId = uuidV4();
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );
        await PixDevolutionFactory.create<PixDevolutionModel>(
          PixDevolutionModel.name,
          { userId, operationId, deposit },
        );

        const message: GetPixDevolutionByOperationIdRequest = {
          operationId,
          userId,
        };

        const result = await controller.execute(
          devolutionRepository,
          depositRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.amount).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.failed).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.deposit).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0002 - Should get devolution successfully with operation (FOR ADMIN USER)', async () => {
        const operationId = uuidV4();
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );
        await PixDevolutionFactory.create<PixDevolutionModel>(
          PixDevolutionModel.name,
          { operationId, deposit },
        );

        const message: GetPixDevolutionByOperationIdRequest = {
          operationId,
        };

        const result = await controller.execute(
          devolutionRepository,
          depositRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.amount).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.failed).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.deposit).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0003 - Should get devolution successfully with operation and wallet', async () => {
        const walletId = uuidV4();
        const operationId = uuidV4();
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );
        await PixDevolutionFactory.create<PixDevolutionModel>(
          PixDevolutionModel.name,
          { walletId, operationId, deposit },
        );

        const message: GetPixDevolutionByOperationIdRequest = {
          operationId,
          walletId,
        };

        const result = await controller.execute(
          devolutionRepository,
          depositRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.userId).toBeDefined();
        expect(result.value.amount).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.failed).toBeDefined();
        expect(result.value.state).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(result.value.deposit).toBeDefined();
        expect(result.value.createdAt).toBeDefined();
      });

      it('TC0004 - Should get devolution successfully with wallet not found', async () => {
        const walletId = uuidV4();
        const operationId = uuidV4();

        await PixDevolutionFactory.create<PixDevolutionModel>(
          PixDevolutionModel.name,
          { operationId },
        );

        const message: GetPixDevolutionByOperationIdRequest = {
          operationId,
          walletId,
        };

        const result = await controller.execute(
          devolutionRepository,
          depositRepository,
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
