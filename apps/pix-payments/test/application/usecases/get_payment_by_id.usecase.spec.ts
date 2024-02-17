import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { PaymentEntity, PaymentRepository } from '@zro/pix-payments/domain';
import { GetPaymentByIdUseCase as UseCase } from '@zro/pix-payments/application';
import { PaymentFactory } from '@zro/test/pix-payments/config';

describe('GetPaymentByIdUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const { paymentRepository, mockGetPaymentRepository } = mockRepository();

    const sut = new UseCase(logger, paymentRepository);
    return {
      sut,
      paymentRepository,
      mockGetPaymentRepository,
    };
  };

  const mockRepository = () => {
    const paymentRepository: PaymentRepository =
      createMock<PaymentRepository>();
    const mockGetPaymentRepository: jest.Mock = On(paymentRepository).get(
      method((mock) => mock.getById),
    );

    return {
      paymentRepository,
      mockGetPaymentRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetPaymentRepository } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get payment successfully', async () => {
      const { sut, mockGetPaymentRepository } = makeSut();
      const id = faker.datatype.uuid();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
      );
      mockGetPaymentRepository.mockResolvedValue(payment);

      const result = await sut.execute(id, user);

      expect(result).toBeDefined();
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentRepository).toHaveBeenCalledWith(id);
    });
  });
});
