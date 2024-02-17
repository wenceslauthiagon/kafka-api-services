import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  getMoment,
  defaultLogger as logger,
  MissingDataException,
} from '@zro/common';
import {
  QrCodeDynamicRepository,
  QrCodeDynamicEntity,
} from '@zro/pix-payments/domain';
import {
  GetQrCodeDynamicDueDateByIdUseCase as UseCase,
  PixPaymentGateway,
  QrCodeDynamicDueDateNotFoundException,
} from '@zro/pix-payments/application';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';

describe('GetQrCodeDynamicDueDateByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const qrCodeDynamicRepository: QrCodeDynamicRepository =
      createMock<QrCodeDynamicRepository>();
    const mockGetQrCodeDynamicByIdRepository: jest.Mock = On(
      qrCodeDynamicRepository,
    ).get(method((mock) => mock.getById));

    const mockUpdateQrCodeDynamicRepository: jest.Mock = On(
      qrCodeDynamicRepository,
    ).get(method((mock) => mock.update));

    return {
      qrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
      mockUpdateQrCodeDynamicRepository,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockUpdateQrCodeDynamicDueDateGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.updateQrCodeDynamicDueDate),
    );

    return {
      pspGateway,
      mockUpdateQrCodeDynamicDueDateGateway,
    };
  };

  const makeSut = () => {
    const {
      qrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
      mockUpdateQrCodeDynamicRepository,
    } = mockRepository();

    const { pspGateway, mockUpdateQrCodeDynamicDueDateGateway } = mockGateway();

    const sut = new UseCase(logger, qrCodeDynamicRepository, pspGateway);
    return {
      sut,
      qrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
      mockUpdateQrCodeDynamicRepository,
      mockUpdateQrCodeDynamicDueDateGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get qrCodeDynamicDueDate successfully', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockUpdateQrCodeDynamicDueDateGateway,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          {
            dueDate: getMoment().toDate(),
            expirationDate: getMoment().toDate(),
            externalId: faker.datatype.uuid(),
          },
        );

      const payloadJws = faker.datatype.string(150);

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);
      mockUpdateQrCodeDynamicDueDateGateway.mockResolvedValueOnce({
        payloadJws,
      });

      qrCodeDynamic.payloadJws = payloadJws;

      mockUpdateQrCodeDynamicRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(qrCodeDynamic.state);
      expect(result.emv).toBe(qrCodeDynamic.emv);
      expect(result.pixKey).toBe(qrCodeDynamic.pixKey);
      expect(result.documentValue).toBe(qrCodeDynamic.documentValue);
      expect(result.description).toBe(qrCodeDynamic.description);
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get qrCodeDynamicDueDate if missing params.', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockUpdateQrCodeDynamicDueDateGateway,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw QrCodeDynamicDueDateNotFoundException if qrCodeDynamicDueDate not found.', async () => {
      const {
        sut,
        mockGetQrCodeDynamicByIdRepository,
        mockUpdateQrCodeDynamicRepository,
        mockUpdateQrCodeDynamicDueDateGateway,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(qrCodeDynamic.id);

      await expect(testScript).rejects.toThrow(
        QrCodeDynamicDueDateNotFoundException,
      );

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateQrCodeDynamicDueDateGateway).toHaveBeenCalledTimes(0);
    });
  });
});
