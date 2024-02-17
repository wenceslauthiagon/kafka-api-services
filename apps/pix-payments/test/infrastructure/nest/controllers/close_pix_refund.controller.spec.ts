import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixRefundNotFoundException } from '@zro/pix-payments/application';
import { PixRefundRepository } from '@zro/pix-payments/domain';
import {
  ClosePixRefundMicroserviceController as Controller,
  PixRefundDatabaseRepository,
  PixRefundModel,
} from '@zro/pix-payments/infrastructure';
import {
  ClosePixRefundRequest,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PixRefundFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';

describe('ClosePixRefundMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let refundRepository: PixRefundRepository;

  const eventEmitter: PixRefundEventEmitterControllerInterface =
    createMock<PixRefundEventEmitterControllerInterface>();
  const mockEmitRefundEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitPixRefundEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    refundRepository = new PixRefundDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ClosePixRefund', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create without issueId', async () => {
        const message: ClosePixRefundRequest = {
          issueId: null,
          analysisDetails: faker.random.word(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            refundRepository,
            eventEmitter,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not create if refund no exists', async () => {
        const message: ClosePixRefundRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          analysisDetails: faker.random.word(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            refundRepository,
            eventEmitter,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixRefundNotFoundException);
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should create refund successfully', async () => {
        const { issueId } = await PixRefundFactory.create<PixRefundModel>(
          PixRefundModel.name,
        );

        const message: ClosePixRefundRequest = {
          issueId,
          analysisDetails: faker.random.word(),
        };

        const result = await controller.execute(
          logger,
          refundRepository,
          eventEmitter,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
