import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  PaymentRepository,
  DecodedQrCodeRepository,
  DecodedPixAccountRepository,
  PaymentType,
  PaymentEntity,
  DecodedQrCodeEntity,
} from '@zro/pix-payments/domain';
import { GetPaymentByOperationIdUseCase as UseCase } from '@zro/pix-payments/application';
import {
  DecodedQrCodeFactory,
  PaymentFactory,
} from '@zro/test/pix-payments/config';

describe('GetPaymentByOperationIdUseCase', () => {
  const paymentRepositoryMock: PaymentRepository =
    createMock<PaymentRepository>();
  const mockGetByOperation: jest.Mock = On(paymentRepositoryMock).get(
    method((mock) => mock.getByOperation),
  );

  const decodedQrCodeRepositoryMock: DecodedQrCodeRepository =
    createMock<DecodedQrCodeRepository>();
  const mockGetByIdDecodedQrCode: jest.Mock = On(
    decodedQrCodeRepositoryMock,
  ).get(method((mock) => mock.getById));

  const decodedPixAccountRepositoryMock: DecodedPixAccountRepository =
    createMock<DecodedPixAccountRepository>();

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get a payment by operationId and user successfully', async () => {
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { paymentType: PaymentType.QR_CODE },
      );
      const decodedeQrCode =
        await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
          DecodedQrCodeEntity.name,
        );

      mockGetByOperation.mockResolvedValue(payment);
      mockGetByIdDecodedQrCode.mockResolvedValue(decodedeQrCode);

      const usecase = new UseCase(
        logger,
        paymentRepositoryMock,
        decodedQrCodeRepositoryMock,
        decodedPixAccountRepositoryMock,
      );

      const result = await usecase.execute(payment.operation, payment.user);

      expect(result).toBeDefined();
      expect(result).toMatchObject(payment);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDecodedQrCode).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should get a payment by operationId successfully', async () => {
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
        { paymentType: PaymentType.QR_CODE },
      );
      const decodedeQrCode =
        await DecodedQrCodeFactory.create<DecodedQrCodeEntity>(
          DecodedQrCodeEntity.name,
        );

      mockGetByOperation.mockResolvedValue(payment);
      mockGetByIdDecodedQrCode.mockResolvedValue(decodedeQrCode);

      const usecase = new UseCase(
        logger,
        paymentRepositoryMock,
        decodedQrCodeRepositoryMock,
        decodedPixAccountRepositoryMock,
      );

      const result = await usecase.execute(payment.operation, null);

      expect(result).toBeDefined();
      expect(result).toMatchObject(payment);

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByIdDecodedQrCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it("TC0003 - Should not get payment if it isn't found", async () => {
      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      mockGetByOperation.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        paymentRepositoryMock,
        decodedQrCodeRepositoryMock,
        decodedPixAccountRepositoryMock,
      );

      const result = await usecase.execute(operation, user);

      expect(result).toBeNull();

      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });
  });
});
