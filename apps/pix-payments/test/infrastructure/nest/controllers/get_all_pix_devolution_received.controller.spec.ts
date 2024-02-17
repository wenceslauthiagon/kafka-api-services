import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixDevolutionReceivedRepository } from '@zro/pix-payments/domain';
import {
  PixDevolutionReceivedModel,
  GetAllPixDevolutionReceivedMicroserviceController as Controller,
  PixDevolutionReceivedDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixDevolutionReceivedFactory } from '@zro/test/pix-payments/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetAllPixDevolutionReceivedRequest } from '@zro/pix-payments/interface';

describe('GetAllPixDevolutionReceivedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let devolutionReceivedRepository: PixDevolutionReceivedRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    devolutionReceivedRepository =
      new PixDevolutionReceivedDatabaseRepository();
  });

  describe('GetAllPixDevolutionReceived', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get Devolutions received successfully', async () => {
        const userId = uuidV4();
        await PixDevolutionReceivedFactory.createMany<PixDevolutionReceivedModel>(
          PixDevolutionReceivedModel.name,
          3,
          {
            userId,
          },
        );

        const message: GetAllPixDevolutionReceivedRequest = {
          userId,
        };

        const result = await controller.execute(
          devolutionReceivedRepository,
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
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0004 - Should get Devolutions received with incorrect userId', async () => {
        const message: GetAllPixDevolutionReceivedRequest = {
          userId: 'x',
        };

        const testScript = () =>
          controller.execute(
            devolutionReceivedRepository,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
