import { method, On } from 'ts-auto-mock/extension';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common/test';
import {
  FeatureSettingEntity,
  FeatureSettingRepository,
  FeatureSettingState,
} from '@zro/utils/domain';
import {
  FeatureSettingEventEmitter,
  FeatureSettingNotFoundException,
  UpdateFeatureSettingStateUseCase as UseCase,
} from '@zro/utils/application';
import { FeatureSettingFactory } from '@zro/test/utils/config';
import { MissingDataException } from '@zro/common';

describe('UpdateFeatureSettingStateUseCase', () => {
  const mockRepository = () => {
    const featureSettingRepository: FeatureSettingRepository =
      createMock<FeatureSettingRepository>();

    const mockGetFeatureSettingRepository: jest.Mock = On(
      featureSettingRepository,
    ).get(method((mock) => mock.getById));

    const mockUpdateFeatureSettingRepository: jest.Mock = On(
      featureSettingRepository,
    ).get(method((mock) => mock.update));

    return {
      featureSettingRepository,
      mockGetFeatureSettingRepository,
      mockUpdateFeatureSettingRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: FeatureSettingEventEmitter =
      createMock<FeatureSettingEventEmitter>();

    const mockUpdatedEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.updateFeatureCreateExchangeQuotation),
    );

    return {
      eventEmitter,
      mockUpdatedEmitter,
    };
  };

  const makeSut = () => {
    const {
      featureSettingRepository,
      mockGetFeatureSettingRepository,
      mockUpdateFeatureSettingRepository,
    } = mockRepository();

    const { eventEmitter, mockUpdatedEmitter } = mockEmitter();

    const sut = new UseCase(logger, featureSettingRepository, eventEmitter);

    return {
      sut,
      featureSettingRepository,
      mockGetFeatureSettingRepository,
      mockUpdateFeatureSettingRepository,
      mockUpdatedEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetFeatureSettingRepository,
        mockUpdateFeatureSettingRepository,
        mockUpdatedEmitter,
      } = makeSut();

      await expect(sut.execute(null, null)).rejects.toThrow(
        MissingDataException,
      );
      expect(mockGetFeatureSettingRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateFeatureSettingRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if feature setting not found', async () => {
      const {
        sut,
        mockGetFeatureSettingRepository,
        mockUpdateFeatureSettingRepository,
        mockUpdatedEmitter,
      } = makeSut();

      const { id, state } =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
        );

      mockGetFeatureSettingRepository.mockResolvedValue(undefined);

      await expect(sut.execute(id, state)).rejects.toThrow(
        FeatureSettingNotFoundException,
      );
      expect(mockGetFeatureSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateFeatureSettingRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should update feature setting successfully', async () => {
      const {
        sut,
        mockGetFeatureSettingRepository,
        mockUpdateFeatureSettingRepository,
        mockUpdatedEmitter,
      } = makeSut();

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          { state: FeatureSettingState.ACTIVE },
        );

      mockGetFeatureSettingRepository.mockResolvedValue(featureSetting);

      const result = await sut.execute(
        featureSetting.id,
        FeatureSettingState.DEACTIVE,
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(featureSetting.id);
      expect(result.name).toBe(featureSetting.name);
      expect(result.state).toBe(featureSetting.state);
      expect(result.updatedAt).toBeDefined();
      expect(mockGetFeatureSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockGetFeatureSettingRepository).toHaveBeenCalledWith(
        featureSetting.id,
      );
      expect(mockUpdateFeatureSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
