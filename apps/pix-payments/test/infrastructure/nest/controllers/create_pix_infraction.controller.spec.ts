import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixTransactionNotFoundException } from '@zro/pix-payments/application';
import {
  PixInfractionRepository,
  PaymentRepository,
  PixInfractionType,
  PixInfractionStatus,
  PixInfractionState,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  CreatePixInfractionMicroserviceController as Controller,
  PaymentModel,
  PixInfractionDatabaseRepository,
  PaymentDatabaseRepository,
  PixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  CreatePixInfractionRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateInfractionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let infractionRepository: PixInfractionRepository;
  let paymentRepository: PaymentRepository;
  let devolutionRepository: PixDevolutionRepository;

  const eventEmitter: PixInfractionEventEmitterControllerInterface =
    createMock<PixInfractionEventEmitterControllerInterface>();
  const mockEmitInfractionEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitInfractionEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    infractionRepository = new PixInfractionDatabaseRepository();
    paymentRepository = new PaymentDatabaseRepository();
    devolutionRepository = new PixDevolutionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateInfraction', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create with invalid issue id', async () => {
        const message: CreatePixInfractionRequest = {
          id: faker.datatype.uuid(),
          description: faker.random.word(),
          infractionType: PixInfractionType.FRAUD,
          issueId: null,
          status: PixInfractionStatus.NEW,
          operationId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
            paymentRepository,
            devolutionRepository,
            eventEmitter,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not create if payment no exists', async () => {
        await PaymentModel.truncate();

        const message: CreatePixInfractionRequest = {
          id: faker.datatype.uuid(),
          description: faker.random.word(),
          infractionType: PixInfractionType.FRAUD,
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          status: PixInfractionStatus.NEW,
          operationId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            logger,
            infractionRepository,
            paymentRepository,
            devolutionRepository,
            eventEmitter,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          PixTransactionNotFoundException,
        );
        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should create infraction successfully', async () => {
        const { operationId } = await PaymentFactory.create<PaymentModel>(
          PaymentModel.name,
        );

        const message: CreatePixInfractionRequest = {
          id: faker.datatype.uuid(),
          description: faker.random.word(),
          infractionType: PixInfractionType.FRAUD,
          issueId: faker.datatype.number({ min: 1, max: 99999 }),
          status: PixInfractionStatus.NEW,
          operationId,
        };

        const result = await controller.execute(
          logger,
          infractionRepository,
          paymentRepository,
          devolutionRepository,
          eventEmitter,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.state).toBe(PixInfractionState.NEW_CONFIRMED);
        expect(result.value.status).toBe(PixInfractionStatus.NEW);

        expect(mockEmitInfractionEvent).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
