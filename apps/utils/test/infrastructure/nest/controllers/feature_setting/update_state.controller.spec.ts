import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  FeatureSettingRepository,
  FeatureSettingState,
} from '@zro/utils/domain';
import {
  UpdateFeatureSettingStateMicroserviceController as Controller,
  FeatureSettingDatabaseRepository,
  FeatureSettingModel,
} from '@zro/utils/infrastructure';
import { AppModule } from '@zro/utils/infrastructure/nest/modules/app.module';
import {
  FeatureSettingEventEmitterControllerInterface,
  FeatureSettingEventType,
  UpdateFeatureSettingStateRequest,
} from '@zro/utils/interface';
import { FeatureSettingFactory } from '@zro/test/utils/config';

describe('UpdateFeatureSettingStateMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let featureSettingRepository: FeatureSettingRepository;

  const eventEmitterController: FeatureSettingEventEmitterControllerInterface =
    createMock<FeatureSettingEventEmitterControllerInterface>();
  const mockUpdatedEvent: jest.Mock = On(eventEmitterController).get(
    method((mock) => mock.emitFeatureSettingEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    featureSettingRepository = new FeatureSettingDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('UpdateFeatureSettingState', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not update if missing params', async () => {
        const message: UpdateFeatureSettingStateRequest = {
          id: null,
          state: null,
        };

        const test = () =>
          controller.execute(
            message,
            featureSettingRepository,
            eventEmitterController,
            logger,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
        expect(mockUpdatedEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should update active successfully', async () => {
        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingModel>(
            FeatureSettingModel.name,
            { state: FeatureSettingState.DEACTIVE },
          );

        const message: UpdateFeatureSettingStateRequest = {
          id: featureSetting.id,
          state: FeatureSettingState.ACTIVE,
        };

        const result = await controller.execute(
          message,
          featureSettingRepository,
          eventEmitterController,
          logger,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBe(featureSetting.id);
        expect(result.value.name).toBe(featureSetting.name);
        expect(result.value.state).toBe(FeatureSettingState.ACTIVE);
        expect(result.value.updatedAt).toBeDefined();
        expect(mockUpdatedEvent).toHaveBeenCalledTimes(1);
        expect(mockUpdatedEvent.mock.calls[0][0]).toBe(
          FeatureSettingEventType.UPDATE_CREATE_EXCHANGE_QUOTATION,
        );
      });

      it('TC0003 - Should update deactive successfully', async () => {
        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingModel>(
            FeatureSettingModel.name,
            { state: FeatureSettingState.ACTIVE },
          );

        const message: UpdateFeatureSettingStateRequest = {
          id: featureSetting.id,
          state: FeatureSettingState.DEACTIVE,
        };

        const result = await controller.execute(
          message,
          featureSettingRepository,
          eventEmitterController,
          logger,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBe(featureSetting.id);
        expect(result.value.name).toBe(featureSetting.name);
        expect(result.value.state).toBe(FeatureSettingState.DEACTIVE);
        expect(result.value.updatedAt).toBeDefined();
        expect(mockUpdatedEvent).toHaveBeenCalledTimes(1);
        expect(mockUpdatedEvent.mock.calls[0][0]).toBe(
          FeatureSettingEventType.UPDATE_CREATE_EXCHANGE_QUOTATION,
        );
      });

      it('TC0004 - Should not update with idempotency', async () => {
        const featureSetting =
          await FeatureSettingFactory.create<FeatureSettingModel>(
            FeatureSettingModel.name,
            { state: FeatureSettingState.DEACTIVE },
          );

        const message: UpdateFeatureSettingStateRequest = {
          id: featureSetting.id,
          state: featureSetting.state,
        };

        const result = await controller.execute(
          message,
          featureSettingRepository,
          eventEmitterController,
          logger,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBe(featureSetting.id);
        expect(result.value.name).toBe(featureSetting.name);
        expect(result.value.state).toBe(FeatureSettingState.DEACTIVE);
        expect(result.value.updatedAt).toBeDefined();
        expect(mockUpdatedEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
