import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { RemittanceRepository, RemittanceStatus } from '@zro/otc/domain';
import {
  RemittanceDatabaseRepository,
  RemittanceModel,
  ManuallyCloseRemittanceMicroserviceController as Controller,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { RemittanceFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import {
  ManuallyCloseRemittanceRequest,
  RemittanceEventEmitterControllerInterface,
} from '@zro/otc/interface';

describe('ManuallyCloseRemittanceMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let remittanceRepository: RemittanceRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  const remittanceEventEmitter: RemittanceEventEmitterControllerInterface =
    createMock<RemittanceEventEmitterControllerInterface>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    remittanceRepository = new RemittanceDatabaseRepository();
  });

  describe('Manually close remittance', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to manually close remittance successfully', async () => {
        const remittance = await RemittanceFactory.create<RemittanceModel>(
          RemittanceModel.name,
          {
            bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
            resultAmount: faker.datatype.number({ min: 1, max: 999999 }),
          },
        );

        const message: ManuallyCloseRemittanceRequest = {
          id: remittance.id,
          bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
          resultAmount: faker.datatype.number({ min: 1, max: 999999 }),
          status: RemittanceStatus.CLOSED_MANUALLY,
        };

        const result = await controller.execute(
          remittanceRepository,
          logger,
          message,
          remittanceEventEmitter,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able to manually close remittance with incorrect data type', async () => {
        await RemittanceFactory.create<RemittanceModel>(RemittanceModel.name);

        const message: ManuallyCloseRemittanceRequest = {
          bankQuote: null,
          id: null,
          resultAmount: null,
          status: null,
        };

        const testScript = () =>
          controller.execute(
            remittanceRepository,
            logger,
            message,
            remittanceEventEmitter,
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
