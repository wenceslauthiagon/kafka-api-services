import { method, On } from 'ts-auto-mock/extension';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  FeatureSettingEntity,
  FeatureSettingRepository,
} from '@zro/utils/domain';
import { GetFeatureSettingByNameUseCase as UseCase } from '@zro/utils/application';
import { FeatureSettingFactory } from '@zro/test/utils/config';

describe('GetFeatureSettingByNameUseCase', () => {
  const mockRepository = () => {
    const featureSettingRepository: FeatureSettingRepository =
      createMock<FeatureSettingRepository>();

    const mockGetFeatureSettingRepository: jest.Mock = On(
      featureSettingRepository,
    ).get(method((mock) => mock.getByName));

    return {
      featureSettingRepository,
      mockGetFeatureSettingRepository,
    };
  };

  const makeSut = () => {
    const { featureSettingRepository, mockGetFeatureSettingRepository } =
      mockRepository();

    const sut = new UseCase(logger, featureSettingRepository);

    return {
      sut,
      featureSettingRepository,
      mockGetFeatureSettingRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetFeatureSettingRepository } = makeSut();

      await expect(sut.execute(null)).rejects.toThrow(MissingDataException);
      expect(mockGetFeatureSettingRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get feature setting successfully', async () => {
      const { sut, mockGetFeatureSettingRepository } = makeSut();

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
        );

      mockGetFeatureSettingRepository.mockResolvedValue(featureSetting);

      const result = await sut.execute(featureSetting.name);

      expect(result).toBeDefined();
      expect(result.id).toBe(featureSetting.id);
      expect(result.name).toBe(featureSetting.name);
      expect(result.state).toBe(featureSetting.state);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockGetFeatureSettingRepository).toHaveBeenCalledTimes(1);
      expect(mockGetFeatureSettingRepository).toHaveBeenCalledWith(
        featureSetting.name,
      );
    });
  });
});
