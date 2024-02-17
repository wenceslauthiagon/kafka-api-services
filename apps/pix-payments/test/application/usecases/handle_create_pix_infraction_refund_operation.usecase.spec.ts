import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositState,
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import { OperationEntity, OperationState } from '@zro/operations/domain';
import {
  HandleCreatePixInfractionRefundOperationUseCase as UseCase,
  OperationService,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  PixInfractionRefundOperationFactory,
} from '@zro/test/pix-payments/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('HandleCreatePixInfractionRefundOperationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetOperationById: jest.Mock = On(operationService).get(
      method((mock) => mock.getOperationById),
    );
    const mockCreateOperation: jest.Mock = On(operationService).get(
      method((mock) => mock.createOperation),
    );
    return {
      operationService,
      mockGetOperationById,
      mockCreateOperation,
    };
  };

  const mockRepository = () => {
    const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
      createMock<PixInfractionRefundOperationRepository>();
    const mockGetAllInfractionRefundOperation: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.getAllByFilter));
    const mockCreateInfractionRefundOperation: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.create));

    return {
      pixInfractionRefundOperationRepository,
      mockGetAllInfractionRefundOperation,
      mockCreateInfractionRefundOperation,
    };
  };

  const makeSut = () => {
    const pixPaymentOperationCurrencyTag = 'REAL';
    const pixPaymentOperationInfractionTransactionTag = 'PIXREFUND';

    const {
      pixInfractionRefundOperationRepository,
      mockGetAllInfractionRefundOperation,
      mockCreateInfractionRefundOperation,
    } = mockRepository();

    const { operationService, mockGetOperationById, mockCreateOperation } =
      mockService();

    const sut = new UseCase(
      logger,
      pixInfractionRefundOperationRepository,
      operationService,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationInfractionTransactionTag,
    );

    return {
      sut,
      mockGetAllInfractionRefundOperation,
      mockCreateInfractionRefundOperation,
      mockGetOperationById,
      mockCreateOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const {
        sut,
        mockGetAllInfractionRefundOperation,
        mockCreateInfractionRefundOperation,
        mockGetOperationById,
        mockCreateOperation,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const refundOperationId = uuidV4();

      const testScripts = [
        () =>
          sut.execute(
            null,
            pixDeposit.id,
            pixDeposit.state,
            pixDeposit.user,
            pixDeposit.wallet,
            pixDeposit.amount,
          ),
        () =>
          sut.execute(
            refundOperationId,
            null,
            pixDeposit.state,
            pixDeposit.user,
            pixDeposit.wallet,
            pixDeposit.amount,
          ),
        () =>
          sut.execute(
            refundOperationId,
            pixDeposit.id,
            null,
            pixDeposit.user,
            pixDeposit.wallet,
            pixDeposit.amount,
          ),
        () =>
          sut.execute(
            refundOperationId,
            pixDeposit.id,
            pixDeposit.state,
            null,
            pixDeposit.wallet,
            pixDeposit.amount,
          ),
        () =>
          sut.execute(
            refundOperationId,
            pixDeposit.id,
            pixDeposit.state,
            pixDeposit.user,
            null,
            pixDeposit.amount,
          ),
        () =>
          sut.execute(
            refundOperationId,
            pixDeposit.id,
            pixDeposit.state,
            pixDeposit.user,
            pixDeposit.wallet,
            null,
          ),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetAllInfractionRefundOperation).toHaveBeenCalledTimes(0);
        expect(mockCreateInfractionRefundOperation).toHaveBeenCalledTimes(0);
        expect(mockGetOperationById).toHaveBeenCalledTimes(0);
        expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should return if user has no open pix infraction refund operation.', async () => {
      const {
        sut,
        mockGetAllInfractionRefundOperation,
        mockCreateInfractionRefundOperation,
        mockGetOperationById,
        mockCreateOperation,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.RECEIVED,
        },
      );

      mockGetAllInfractionRefundOperation.mockResolvedValueOnce([]);

      const refundOperationId = uuidV4();

      await sut.execute(
        refundOperationId,
        pixDeposit.id,
        pixDeposit.state,
        pixDeposit.user,
        pixDeposit.wallet,
        pixDeposit.amount,
      );

      expect(mockGetAllInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return if new refund operation has already been created.', async () => {
      const {
        sut,
        mockGetAllInfractionRefundOperation,
        mockCreateInfractionRefundOperation,
        mockGetOperationById,
        mockCreateOperation,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
        );

      const operationFound = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      mockGetAllInfractionRefundOperation.mockResolvedValueOnce([
        pixInfractionRefundOperation,
      ]);
      mockGetOperationById.mockResolvedValueOnce(operationFound);

      await sut.execute(
        pixInfractionRefundOperation.id,
        pixDeposit.id,
        pixDeposit.state,
        pixDeposit.user,
        pixDeposit.wallet,
        pixDeposit.amount,
      );

      expect(mockGetAllInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if refund operation already covers the original operation value.', async () => {
      const {
        sut,
        mockGetAllInfractionRefundOperation,
        mockCreateInfractionRefundOperation,
        mockGetOperationById,
        mockCreateOperation,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.RECEIVED,
        },
      );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
        );

      pixInfractionRefundOperation.refundOperation.value =
        pixInfractionRefundOperation.originalOperation.value;

      mockGetAllInfractionRefundOperation.mockResolvedValueOnce([
        pixInfractionRefundOperation,
      ]);
      mockGetOperationById.mockResolvedValueOnce(null);

      await sut.execute(
        pixInfractionRefundOperation.id,
        pixDeposit.id,
        pixDeposit.state,
        pixDeposit.user,
        pixDeposit.wallet,
        pixDeposit.amount,
      );

      expect(mockGetAllInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create new pix infraction refund operation successfully.', async () => {
      const {
        sut,
        mockGetAllInfractionRefundOperation,
        mockCreateInfractionRefundOperation,
        mockGetOperationById,
        mockCreateOperation,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.RECEIVED,
        },
      );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
        );

      // Refund operation's value is lesser than original operation's value.
      pixInfractionRefundOperation.refundOperation.value =
        pixInfractionRefundOperation.originalOperation.value * 0.6;

      const createOperationResponse = {
        beneficiary: null,
        owner: {
          createdAt: new Date(),
          description: 'PIXREFUND',
          fee: 0,
          id: uuidV4(),
          rawValue: 0,
          state: OperationState.PENDING,
          transactionId: 61,
          value:
            pixInfractionRefundOperation.originalOperation.value -
            pixInfractionRefundOperation.refundOperation.value,
        },
      };

      mockGetAllInfractionRefundOperation.mockResolvedValueOnce([
        pixInfractionRefundOperation,
      ]);
      mockGetOperationById.mockResolvedValueOnce(null);
      mockGetOperationById.mockResolvedValueOnce(
        pixInfractionRefundOperation.originalOperation,
      );
      mockCreateOperation.mockResolvedValueOnce(createOperationResponse);

      await sut.execute(
        pixInfractionRefundOperation.id,
        pixDeposit.id,
        pixDeposit.state,
        pixDeposit.user,
        pixDeposit.wallet,
        pixDeposit.amount,
      );

      expect(mockGetAllInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(2);
      expect(mockCreateOperation).toHaveBeenCalledTimes(1);
    });
  });
});
