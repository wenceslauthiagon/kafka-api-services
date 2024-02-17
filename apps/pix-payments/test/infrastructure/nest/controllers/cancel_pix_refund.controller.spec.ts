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
import {
  PixInfractionRefundOperationRepository,
  PixRefundRejectionReason,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import {
  CancelPixRefundMicroserviceController as Controller,
  PixRefundDatabaseRepository,
  PixRefundModel,
  OperationServiceKafka,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  CancelPixRefundRequest,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PixRefundFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';

describe('CancelPixRefundMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let refundRepository: PixRefundRepository;
  let pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository;

  const eventEmitter: PixRefundEventEmitterControllerInterface =
    createMock<PixRefundEventEmitterControllerInterface>();
  const mockEmitRefundEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitPixRefundEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    refundRepository = new PixRefundDatabaseRepository();
    pixInfractionRefundOperationRepository =
      new PixInfractionRefundOperationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CancelPixRefund', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create without issueId', async () => {
        const message: CancelPixRefundRequest = {
          issueId: null,
          analysisDetails: faker.random.word(),
          rejectionReason: PixRefundRejectionReason.NO_BALANCE,
        };

        const testScript = () =>
          controller.execute(
            logger,
            refundRepository,
            pixInfractionRefundOperationRepository,
            eventEmitter,
            message,
            operationService,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitRefundEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not create if refund no exists', async () => {
        const message: CancelPixRefundRequest = {
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          analysisDetails: faker.random.word(),
          rejectionReason: PixRefundRejectionReason.NO_BALANCE,
        };

        const testScript = () =>
          controller.execute(
            logger,
            refundRepository,
            pixInfractionRefundOperationRepository,
            eventEmitter,
            message,
            operationService,
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

        const message: CancelPixRefundRequest = {
          issueId,
          analysisDetails: faker.random.word(),
          rejectionReason: PixRefundRejectionReason.NO_BALANCE,
        };

        const result = await controller.execute(
          logger,
          refundRepository,
          pixInfractionRefundOperationRepository,
          eventEmitter,
          message,
          operationService,
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
