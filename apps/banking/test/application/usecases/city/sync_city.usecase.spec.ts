import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common/test';
import { CityRepository, CityEntity } from '@zro/banking/domain';
import {
  CityEventEmitter,
  SyncCityUseCase as UseCase,
} from '@zro/banking/application';
import { CityFactory } from '@zro/test/banking/config';

describe('SyncCityUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      cityRepository,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockDeleteRepository,
    } = mockRepository();
    const {
      eventEmitter,
      mockCreatedEventEmitter,
      mockUpdatedEventEmitter,
      mockDeletedEventEmitter,
    } = mockEvent();

    const sut = new UseCase(logger, cityRepository, eventEmitter);

    return {
      sut,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockDeleteRepository,
      mockCreatedEventEmitter,
      mockUpdatedEventEmitter,
      mockDeletedEventEmitter,
    };
  };

  const mockRepository = () => {
    const cityRepository: CityRepository = createMock<CityRepository>();
    const mockGetRepository: jest.Mock = On(cityRepository).get(
      method((mock) => mock.getAll),
    );
    const mockCreateRepository: jest.Mock = On(cityRepository).get(
      method((mock) => mock.create),
    );
    const mockUpdateRepository: jest.Mock = On(cityRepository).get(
      method((mock) => mock.update),
    );
    const mockDeleteRepository: jest.Mock = On(cityRepository).get(
      method((mock) => mock.delete),
    );
    return {
      cityRepository,
      mockGetRepository,
      mockCreateRepository,
      mockUpdateRepository,
      mockDeleteRepository,
    };
  };

  const mockEvent = () => {
    const eventEmitter: CityEventEmitter = createMock<CityEventEmitter>();
    const mockCreatedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.createdCity),
    );
    const mockUpdatedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.updatedCity),
    );
    const mockDeletedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.deletedCity),
    );
    return {
      eventEmitter,
      mockCreatedEventEmitter,
      mockUpdatedEventEmitter,
      mockDeletedEventEmitter,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should create new city successfully', async () => {
      const city = await CityFactory.create<CityEntity>(CityEntity.name, {
        active: true,
      });

      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();
      mockGetRepository.mockReturnValue([]);

      await sut.execute([city]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should update a city successfully', async () => {
      const city = await CityFactory.create<CityEntity>(CityEntity.name, {
        active: true,
      });
      const newCity = new CityEntity({
        code: city.code,
        name: faker.name.firstName(),
      });
      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();
      mockGetRepository.mockReturnValue([city]);

      await sut.execute([newCity]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update the same city', async () => {
      const city = await CityFactory.create<CityEntity>(CityEntity.name, {
        active: true,
      });
      const sameCity = new CityEntity(city);
      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();
      mockGetRepository.mockReturnValue([city]);

      await sut.execute([sameCity]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should delete a city successfully', async () => {
      const city = await CityFactory.create<CityEntity>(CityEntity.name, {
        active: true,
      });
      const newCity = new CityEntity({
        id: faker.datatype.uuid(),
        code: faker.datatype.number(9999999).toString(),
      });
      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();
      mockGetRepository.mockReturnValue([city]);

      await sut.execute([newCity]);

      expect(mockGetRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0005 - Should not create without new city', async () => {
      const {
        sut,
        mockGetRepository,
        mockCreateRepository,
        mockUpdateRepository,
        mockDeleteRepository,
        mockCreatedEventEmitter,
        mockUpdatedEventEmitter,
        mockDeletedEventEmitter,
      } = makeSut();

      await sut.execute(null);

      expect(mockGetRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdatedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDeletedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
