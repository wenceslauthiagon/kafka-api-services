import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  NotifyCreditValidationEntity,
  NotifyCreditValidationRepository,
} from '@zro/api-jdpi/domain';
import { HandleFailedNotifyCreditValidationEventUsecase as UseCase } from '@zro/api-jdpi/application';
import { NotifyCreditValidationFactory } from '@zro/test/api-jdpi/config';

describe('HandleFailedNotifyCreditValidationEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      notifyCreditValidationRepository,
      mockCreateNotifyCreditValidationRepository,
      mockGetByIdNotifyCreditValidationRepository,
    } = mockRepository();

    const sut = new UseCase(logger, notifyCreditValidationRepository);
    return {
      sut,
      mockCreateNotifyCreditValidationRepository,
      mockGetByIdNotifyCreditValidationRepository,
    };
  };

  const mockRepository = () => {
    const notifyCreditValidationRepository: NotifyCreditValidationRepository =
      createMock<NotifyCreditValidationRepository>();
    const mockCreateNotifyCreditValidationRepository: jest.Mock = On(
      notifyCreditValidationRepository,
    ).get(method((mock) => mock.create));
    const mockGetByIdNotifyCreditValidationRepository: jest.Mock = On(
      notifyCreditValidationRepository,
    ).get(method((mock) => mock.getById));

    return {
      notifyCreditValidationRepository,
      mockCreateNotifyCreditValidationRepository,
      mockGetByIdNotifyCreditValidationRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should return when notify credit validation found by id', async () => {
      const {
        sut,
        mockCreateNotifyCreditValidationRepository,
        mockGetByIdNotifyCreditValidationRepository,
      } = makeSut();
      const notifyCreditValidation =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          { endToEndId: faker.datatype.uuid() },
        );

      mockGetByIdNotifyCreditValidationRepository.mockResolvedValue(
        notifyCreditValidation,
      );

      const testScript = await sut.execute(notifyCreditValidation);

      expect(testScript).toBeDefined();
      expect(mockGetByIdNotifyCreditValidationRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateNotifyCreditValidationRepository).toHaveBeenCalledTimes(
        0,
      );
    });

    it('TC0002 - Should create failed notify credit validation successfully', async () => {
      const {
        sut,
        mockCreateNotifyCreditValidationRepository,
        mockGetByIdNotifyCreditValidationRepository,
      } = makeSut();
      const notifyCreditValidation =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
        );

      mockGetByIdNotifyCreditValidationRepository.mockResolvedValue(null);

      const testScript = await sut.execute(notifyCreditValidation);

      expect(testScript).toBeDefined();

      expect(mockGetByIdNotifyCreditValidationRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreateNotifyCreditValidationRepository).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
