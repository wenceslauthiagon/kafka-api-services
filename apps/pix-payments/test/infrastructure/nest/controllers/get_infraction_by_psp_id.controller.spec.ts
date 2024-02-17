import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  GetPixInfractionByPspIdMicroserviceController as Controller,
  PixInfractionDatabaseRepository,
  PixInfractionModel,
} from '@zro/pix-payments/infrastructure';
import { InfractionFactory } from '@zro/test/pix-payments/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetPixInfractionByPspIdRequest } from '@zro/pix-payments/interface';

describe('GetByIdPspInfractionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let infractionRepository: PixInfractionDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    infractionRepository = new PixInfractionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetByIdPspInfraction', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get by id successfully', async () => {
        const infraction = await InfractionFactory.create<PixInfractionModel>(
          PixInfractionModel.name,
        );

        const message: GetPixInfractionByPspIdRequest = {
          id: infraction.infractionPspId,
        };

        const result = await controller.execute(
          infractionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(infraction.id);
        expect(result.value.state).toBe(infraction.state);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
