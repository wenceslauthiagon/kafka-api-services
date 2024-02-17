import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  RemittanceOrderNotFoundException,
  GetRemittanceOrderByIdUseCase as UseCase,
} from '@zro/otc/application';
import {
  RemittanceOrderEntity,
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
} from '@zro/otc/domain';
import { RemittanceOrderFactory } from '@zro/test/otc/config';

describe('GetRemittanceOrderByIdUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRepository = () => {
    const remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository =
      createMock<RemittanceOrderRemittanceRepository>();
    const remittanceOrderRepository: RemittanceOrderRepository =
      createMock<RemittanceOrderRepository>();

    const mockGetById: jest.Mock = On(remittanceOrderRepository).get(
      method((mock) => mock.getById),
    );

    const mockGetByRemittanceOrder: jest.Mock = On(
      remittanceOrderRemittanceRepository,
    ).get(method((mock) => mock.getAllByRemittanceOrder));

    return {
      remittanceOrderRemittanceRepository,
      remittanceOrderRepository,
      mockGetById,
      mockGetByRemittanceOrder,
    };
  };

  const makeSut = () => {
    const {
      remittanceOrderRemittanceRepository,
      remittanceOrderRepository,
      mockGetById,
      mockGetByRemittanceOrder,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      remittanceOrderRepository,
      remittanceOrderRemittanceRepository,
    );

    return {
      sut,
      mockGetById,
      mockGetByRemittanceOrder,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get remittance order successfully.', async () => {
      const { sut, mockGetById, mockGetByRemittanceOrder } = makeSut();

      const remittanceOrders =
        await RemittanceOrderFactory.create<RemittanceOrderEntity>(
          RemittanceOrderEntity.name,
        );

      mockGetById.mockResolvedValue(remittanceOrders);

      const result = await sut.execute(remittanceOrders.id);

      expect(result).toBeDefined();
      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockGetByRemittanceOrder).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw missing ID.', async () => {
      const { sut, mockGetById, mockGetByRemittanceOrder } = makeSut();

      mockGetByRemittanceOrder.mockResolvedValue([]);

      await expect(sut.execute(null)).rejects.toThrow(MissingDataException);
      expect(mockGetById).not.toBeCalled();
      expect(mockGetByRemittanceOrder).not.toBeCalled();
    });

    it('TC0003 - Should throw order not found', async () => {
      const { sut, mockGetById } = makeSut();

      mockGetById.mockResolvedValue(null);

      await expect(sut.execute('1')).rejects.toThrow(
        RemittanceOrderNotFoundException,
      );
    });
  });
});
