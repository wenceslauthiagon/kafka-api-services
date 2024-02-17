import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { RemittanceRepository } from '@zro/otc/domain';
import {
  GetRemittanceByIdMicroserviceController as Controller,
  RemittanceDatabaseRepository,
  RemittanceModel,
} from '@zro/otc/infrastructure';
import { RemittanceFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetRemittanceByIdRequest } from '@zro/otc/interface';
import { RemittanceNotFoundException } from '@zro/otc/application';

describe('GetRemittanceByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let remittanceRepository: RemittanceRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    remittanceRepository = new RemittanceDatabaseRepository();
  });

  describe('GetRemittanceById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get Remittance successfully', async () => {
        const remittance = await RemittanceFactory.create<RemittanceModel>(
          RemittanceModel.name,
          {
            bankQuote: faker.datatype.number({ min: 1, max: 999999 }),
          },
        );

        const message: GetRemittanceByIdRequest = {
          id: remittance.id,
        };

        const result = await controller.execute(
          remittanceRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(remittance.id);
        expect(result.value.amount).toBeDefined();
        expect(result.value.currencyId).toBeDefined();
        expect(result.value.side).toBeDefined();
        expect(result.value.status).toBeDefined();
        expect(result.value.systemId).toBeDefined();
      });
    });
    describe('With invalid parameters', () => {
      it('TC0002 - Should throw InvalidDataFormatException when missing param', async () => {
        const message: GetRemittanceByIdRequest = {
          id: null,
        };

        const result = () =>
          controller.execute(remittanceRepository, logger, message, ctx);

        await expect(result).rejects.toThrow(InvalidDataFormatException);
      });

      it('TC0003 - Should throw RemittanceNotFoundException when Remittance not found', async () => {
        const message: GetRemittanceByIdRequest = {
          id: faker.datatype.uuid(),
        };

        const result = () =>
          controller.execute(remittanceRepository, logger, message, ctx);

        await expect(result).rejects.toThrow(RemittanceNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
