import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  QrCodeDynamicRepository,
  QrCodeDynamicEntity,
} from '@zro/pix-payments/domain';
import {
  GetQrCodeDynamicByIdUseCase as UseCase,
  QrCodeDynamicNotFoundException,
} from '@zro/pix-payments/application';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';
import { UserFactory } from '@zro/test/users/config';

describe('GetQrCodeDynamicByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const qrCodeDynamicRepository: QrCodeDynamicRepository =
      createMock<QrCodeDynamicRepository>();
    const mockGetQrCodeDynamicByIdRepository: jest.Mock = On(
      qrCodeDynamicRepository,
    ).get(method((mock) => mock.getById));

    return {
      qrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
    };
  };

  const makeSut = () => {
    const { qrCodeDynamicRepository, mockGetQrCodeDynamicByIdRepository } =
      mockRepository();

    const sut = new UseCase(logger, qrCodeDynamicRepository);
    return {
      sut,
      qrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get qrCodeDynamic successfully', async () => {
      const { sut, mockGetQrCodeDynamicByIdRepository } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
          {
            user,
          },
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic.id, user);

      expect(result).toBeDefined();
      expect(result.state).toBe(qrCodeDynamic.state);
      expect(result.emv).toBe(qrCodeDynamic.emv);
      expect(result.pixKey).toBe(qrCodeDynamic.pixKey);
      expect(result.documentValue).toBe(qrCodeDynamic.documentValue);
      expect(result.description).toBe(qrCodeDynamic.description);
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get qrCodeDynamic if missing params.', async () => {
      const { sut, mockGetQrCodeDynamicByIdRepository } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const testScript = () => sut.execute(null, user);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not get qrCodeDynamic if qrCodeDynamic not found.', async () => {
      const { sut, mockGetQrCodeDynamicByIdRepository } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(qrCodeDynamic.id, user);

      await expect(testScript).rejects.toThrow(QrCodeDynamicNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should not get qrCodeDynamic if user is distinct.', async () => {
      const { sut, mockGetQrCodeDynamicByIdRepository } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const testScript = () => sut.execute(qrCodeDynamic.id, user);

      await expect(testScript).rejects.toThrow(QrCodeDynamicNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
    });
  });
});
