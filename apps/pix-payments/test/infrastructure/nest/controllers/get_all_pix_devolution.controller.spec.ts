import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixDevolutionRepository } from '@zro/pix-payments/domain';
import {
  PixDevolutionModel,
  GetAllPixDevolutionMicroserviceController as Controller,
  PixDevolutionDatabaseRepository,
  PixDepositModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';
import { GetAllPixDevolutionRequest } from '@zro/pix-payments/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllPixDevolutionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let devolutionRepository: PixDevolutionRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    devolutionRepository = new PixDevolutionDatabaseRepository();
  });

  describe('GetAllPixDevolution', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get Devolutions successfully', async () => {
        const userId = uuidV4();
        const deposit = await PixDepositFactory.create<PixDepositModel>(
          PixDepositModel.name,
        );

        await PixDevolutionFactory.createMany<PixDevolutionModel>(
          PixDevolutionModel.name,
          3,
          {
            userId,
            depositId: deposit.id,
          },
        );

        const message: GetAllPixDevolutionRequest = {
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
          expect(res.userId).toBe(userId);
          expect(res.depositTxId).toBe(deposit.txId);
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0004 - Should get Devolutions with incorrect userId', async () => {
        const message: GetAllPixDevolutionRequest = {
          userId: 'x',
        };

        const testScript = () =>
          controller.execute(devolutionRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
