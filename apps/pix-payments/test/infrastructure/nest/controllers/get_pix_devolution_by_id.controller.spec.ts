import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, FailedEntity } from '@zro/common';
import {
  GetPixDevolutionByIdMicroserviceController as Controller,
  PixDevolutionDatabaseRepository,
  PixDevolutionModel,
  PixDepositModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { GetPixDevolutionByIdRequest } from '@zro/pix-payments/interface';
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('GetByPixDevolutionIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let devolutionRepository: PixDevolutionDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    devolutionRepository = new PixDevolutionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetByPixDevolutionId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get by id successfully', async () => {
        const devolution =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
          );

        const message: GetPixDevolutionByIdRequest = {
          id: devolution.id,
        };

        const result = await controller.execute(
          devolutionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(devolution.id);
        expect(result.value.state).toBe(devolution.state);
        expect(result.value.amount).toBe(devolution.amount);
        expect(result.value.description).toBe(devolution.description);
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.failed?.code).toBeUndefined();
        expect(result.value.failed?.message).toBeUndefined();
      });

      it('TC0002 - Should get by id and user successfully', async () => {
        const userId = uuidV4();
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
          { userId },
        );
        const devolution =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            { userId, depositId: deposit.id },
          );

        const message: GetPixDevolutionByIdRequest = {
          id: devolution.id,
          userId,
        };

        const result = await controller.execute(
          devolutionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(devolution.id);
        expect(result.value.state).toBe(devolution.state);
        expect(result.value.amount).toBe(devolution.amount);
        expect(result.value.description).toBe(devolution.description);
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.failed?.code).toBeUndefined();
        expect(result.value.failed?.message).toBeUndefined();
      });

      it('TC0003 - Should get by id and wallet successfully', async () => {
        const walletId = uuidV4();
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
          { walletId },
        );
        const devolution =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            { walletId, depositId: deposit.id },
          );

        const message: GetPixDevolutionByIdRequest = {
          id: devolution.id,
          walletId,
        };

        const result = await controller.execute(
          devolutionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(devolution.id);
        expect(result.value.state).toBe(devolution.state);
        expect(result.value.amount).toBe(devolution.amount);
        expect(result.value.description).toBe(devolution.description);
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.failed?.code).toBeUndefined();
        expect(result.value.failed?.message).toBeUndefined();
      });

      it('TC0004 - Should get by id successfully when failed exists', async () => {
        const userId = uuidV4();
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
          { userId },
        );
        const devolution =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
            {
              userId,
              depositId: deposit.id,
              failed: new FailedEntity({
                code: 'PIX_DEVOLUTION_MAX_NUMBER',
                message: 'Número máximo de devoluções utilizadas.',
              }),
            },
          );

        const message: GetPixDevolutionByIdRequest = {
          id: devolution.id,
          userId,
        };

        const result = await controller.execute(
          devolutionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(devolution.id);
        expect(result.value.state).toBe(devolution.state);
        expect(result.value.amount).toBe(devolution.amount);
        expect(result.value.description).toBe(devolution.description);
        expect(result.value.createdAt).toBeDefined();
        expect(result.value.failed.code).toBeDefined();
        expect(result.value.failed.message).toBeDefined();
      });

      it('TC0005 - Should not get by id and wallet not found', async () => {
        const walletId = uuidV4();
        const devolution =
          await PixDevolutionFactory.create<PixDevolutionModel>(
            PixDevolutionModel.name,
          );

        const message: GetPixDevolutionByIdRequest = {
          id: devolution.id,
          walletId,
        };

        const result = await controller.execute(
          devolutionRepository,
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
