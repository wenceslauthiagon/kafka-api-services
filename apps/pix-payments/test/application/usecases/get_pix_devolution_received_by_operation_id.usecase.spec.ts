import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  PaymentEntity,
  PaymentRepository,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedRepository,
} from '@zro/pix-payments/domain';
import { OperationEntity } from '@zro/operations/domain';
import {
  GetPixDevolutionReceivedByOperationIdUseCase as UseCase,
  PaymentNotFoundException,
} from '@zro/pix-payments/application';
import {
  PaymentFactory,
  PixDevolutionReceivedFactory,
} from '@zro/test/pix-payments/config';

describe('GetPixDevolutionReceivedByOperationIdUseCase', () => {
  const devolutionReceivedRepositoryMock: PixDevolutionReceivedRepository =
    createMock<PixDevolutionReceivedRepository>();
  const mockGetDevolutionReceivedByOperation: jest.Mock = On(
    devolutionReceivedRepositoryMock,
  ).get(method((mock) => mock.getByOperation));

  const paymentRepositoryMock: PaymentRepository =
    createMock<PaymentRepository>();
  const mockGetPaymentById: jest.Mock = On(paymentRepositoryMock).get(
    method((mock) => mock.getById),
  );

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should get a PixDevolutionReceived by operationId and user successfully', async () => {
      const devolution =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
      );

      mockGetDevolutionReceivedByOperation.mockResolvedValue(devolution);
      mockGetPaymentById.mockResolvedValue(payment);

      const usecase = new UseCase(
        logger,
        devolutionReceivedRepositoryMock,
        paymentRepositoryMock,
      );

      const result = await usecase.execute(
        devolution.operation,
        devolution.user,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject({ ...devolution, payment });
      expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentById).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should get a PixDevolutionReceived by operationId', async () => {
      const devolution =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
      );

      mockGetDevolutionReceivedByOperation.mockResolvedValue(devolution);
      mockGetPaymentById.mockResolvedValue(payment);

      const usecase = new UseCase(
        logger,
        devolutionReceivedRepositoryMock,
        paymentRepositoryMock,
      );

      const result = await usecase.execute(devolution.operation, null);

      expect(result).toBeDefined();
      expect(result).toMatchObject({ ...devolution, payment });

      expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentById).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should get a PixDevolutionReceived by operationId and wallet successfully', async () => {
      const devolution =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );
      const payment = await PaymentFactory.create<PaymentEntity>(
        PaymentEntity.name,
      );

      mockGetDevolutionReceivedByOperation.mockResolvedValue(devolution);
      mockGetPaymentById.mockResolvedValue(payment);

      const usecase = new UseCase(
        logger,
        devolutionReceivedRepositoryMock,
        paymentRepositoryMock,
      );

      const result = await usecase.execute(
        devolution.operation,
        null,
        devolution.wallet,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject({ ...devolution, payment });
      expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not get PixDevolutionReceived if id is null', async () => {
      const usecase = new UseCase(
        logger,
        devolutionReceivedRepositoryMock,
        paymentRepositoryMock,
      );

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentById).toHaveBeenCalledTimes(0);
    });

    it("TC0004 - Should not get PixDevolutionReceived if it isn't found", async () => {
      const operation = new OperationEntity({ id: faker.datatype.uuid() });
      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      mockGetDevolutionReceivedByOperation.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        devolutionReceivedRepositoryMock,
        paymentRepositoryMock,
      );

      const result = await usecase.execute(operation, user);

      expect(result).toBeNull();
      expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentById).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not get PixDevolutionReceived without payment', async () => {
      const devolution =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      mockGetDevolutionReceivedByOperation.mockResolvedValue(devolution);
      mockGetPaymentById.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        devolutionReceivedRepositoryMock,
        paymentRepositoryMock,
      );

      const testScript = () =>
        usecase.execute(devolution.operation, devolution.user);

      await expect(testScript).rejects.toThrow(PaymentNotFoundException);
      expect(mockGetDevolutionReceivedByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentById).toHaveBeenCalledTimes(1);
    });
  });
});
