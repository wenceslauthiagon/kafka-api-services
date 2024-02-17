import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { FeatureSettingRepository } from '@zro/utils/domain';
import {
  GetFeatureSettingByNameMicroserviceController as Controller,
  FeatureSettingDatabaseRepository,
  FeatureSettingModel,
} from '@zro/utils/infrastructure';
import { AppModule } from '@zro/utils/infrastructure/nest/modules/app.module';
import { GetFeatureSettingByNameRequest } from '@zro/utils/interface';
import { FeatureSettingFactory } from '@zro/test/utils/config';

describe('GetFeatureSettingByNameMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let featureSettingRepository: FeatureSettingRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    featureSettingRepository = new FeatureSettingDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetFeatureSettingByName', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not get if missing params', async () => {
        const message: GetFeatureSettingByNameRequest = {
          name: null,
        };

        const test = () =>
          controller.execute(message, featureSettingRepository, logger, ctx);

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should get successfully', async () => {
        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingModel>(
            FeatureSettingModel.name,
          );

        const message: GetFeatureSettingByNameRequest = {
          name: featureSetting.name,
        };

        const result = await controller.execute(
          message,
          featureSettingRepository,
          logger,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.name).toBe(featureSetting.name);
        expect(result.value.state).toBe(featureSetting.state);
        expect(result.value.createdAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
