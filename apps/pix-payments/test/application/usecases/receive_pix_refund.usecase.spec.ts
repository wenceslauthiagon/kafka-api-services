import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixRefundEntity,
  PixInfractionEntity,
  PixRefundRepository,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionRepository,
  PixInfractionState,
  PixRefundStatus,
  PixInfractionAnalysisResultType,
  PixDevolutionReceivedEntity,
  PixDepositEntity,
  PixInfractionRefundOperationRepository,
  PixInfractionRefundOperationEntity,
} from '@zro/pix-payments/domain';
import {
  OperationEntity,
  WalletEntity,
  WalletState,
} from '@zro/operations/domain';
import {
  HandleReceivePixRefundEventUseCase as UseCase,
  PixRefundEventEmitter,
  OperationService,
  PixInfractionNotFoundException,
  PixTransactionNotFoundException,
  PixInfractionInvalidStateException,
  PixRefundInvalidStateException,
} from '@zro/pix-payments/application';
import {
  PixRefundFactory,
  InfractionFactory,
  PixDevolutionReceivedFactory,
  PixDepositFactory,
  PixInfractionRefundOperationFactory,
} from '@zro/test/pix-payments/config';
import { OperationFactory, WalletFactory } from '@zro/test/operations/config';

const pixPaymentOperationCurrencyTag = 'REAL';
const pixPaymentOperationRefundTransactionTag = 'PIXREFUND';

describe('ReceivePixRefundEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixRefundEventEmitter =
      createMock<PixRefundEventEmitter>();

    const mockReceivePendingPixRefundEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.receivePendingPixRefund),
    );

    return {
      eventEmitter,
      mockReceivePendingPixRefundEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockGetInfractionByIdRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getByInfractionPspId));
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetDepositByEndToEndIdRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getByEndToEndId));

    const devolutionReceivedRepository: PixDevolutionReceivedRepository =
      createMock<PixDevolutionReceivedRepository>();
    const mockGetDevolutionReceivedByEndToEndIdRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.getByEndToEndId));

    const refundRepository: PixRefundRepository =
      createMock<PixRefundRepository>();
    const mockCreatePixRefundRepository: jest.Mock = On(refundRepository).get(
      method((mock) => mock.create),
    );
    const mockGetPixRefundBySolicitationIdRepository: jest.Mock = On(
      refundRepository,
    ).get(method((mock) => mock.getBySolicitationId));

    const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
      createMock<PixInfractionRefundOperationRepository>();
    const mockGetAllPixInfractionRefundOperationByFilter: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.getAllByFilter));
    const mockUpdatePixInfractionRefundOperation: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.update));
    const mockCreatePixInfractionRefundOperation: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.create));

    return {
      refundRepository,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      mockGetPixRefundBySolicitationIdRepository,
      mockCreatePixRefundRepository,
      mockGetInfractionByIdRepository,
      mockGetDepositByEndToEndIdRepository,
      mockGetDevolutionReceivedByEndToEndIdRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
      mockCreatePixInfractionRefundOperation,
      mockUpdateInfractionRepository,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      refundRepository,
      devolutionReceivedRepository,
      depositRepository,
      mockCreatePixRefundRepository,
      mockGetPixRefundBySolicitationIdRepository,
      mockGetDepositByEndToEndIdRepository,
      mockGetDevolutionReceivedByEndToEndIdRepository,
      mockGetInfractionByIdRepository,
      pixInfractionRefundOperationRepository,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
      mockCreatePixInfractionRefundOperation,
      mockUpdateInfractionRepository,
    } = mockRepository();

    const { eventEmitter, mockReceivePendingPixRefundEvent } = mockEmitter();

    const operationService: OperationService = createMock<OperationService>();
    const mockGetOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.getOperationById),
    );
    const mockCreateOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.createOperation),
    );
    const mockGetWalletByUserAndDefaultIsTrue: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletByUserAndDefaultIsTrue));

    const sut = new UseCase(
      logger,
      refundRepository,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
      operationService,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationRefundTransactionTag,
    );

    return {
      sut,
      refundRepository,
      depositRepository,
      devolutionReceivedRepository,
      infractionRepository,
      mockCreatePixRefundRepository,
      mockGetPixRefundBySolicitationIdRepository,
      mockGetDepositByEndToEndIdRepository,
      mockGetDevolutionReceivedByEndToEndIdRepository,
      mockGetInfractionByIdRepository,
      mockCreateOperationService,
      mockReceivePendingPixRefundEvent,
      mockGetOperationService,
      mockGetWalletByUserAndDefaultIsTrue,
      mockGetAllPixInfractionRefundOperationByFilter,
      mockUpdatePixInfractionRefundOperation,
      mockCreatePixInfractionRefundOperation,
      mockUpdateInfractionRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params.', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDepositByEndToEndIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CLOSED_CONFIRMED,
        },
      );

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(null);
      mockGetInfractionByIdRepository.mockResolvedValueOnce(infraction);

      const {
        id,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      } = refund;

      const test = [
        sut.execute(
          null,
          infraction.infractionPspId,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        ),
        sut.execute(
          id,
          infraction.infractionPspId,
          contested,
          null,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        ),
        sut.execute(
          id,
          infraction.infractionPspId,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          null,
          solicitationPspId,
        ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not proceed if refund already exists.', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDepositByEndToEndIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
      } = makeSut();

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CLOSED_CONFIRMED,
        },
      );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(refund);

      await sut.execute(
        refund.id,
        infraction.infractionPspId,
        refund.contested,
        refund.amount,
        refund.description,
        refund.reason,
        refund.requesterBank,
        refund.responderBank,
        refund.status,
        refund.transaction,
        refund.solicitationPspId,
      );

      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw PixRefundInvalidStateException if refund status is not OPEN.', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDepositByEndToEndIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
      } = makeSut();

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        {
          status: PixRefundStatus.RECEIVED,
        },
      );

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          refund.id,
          infraction.infractionPspId,
          refund.contested,
          refund.amount,
          refund.description,
          refund.reason,
          refund.requesterBank,
          refund.responderBank,
          refund.status,
          refund.transaction,
          refund.solicitationPspId,
        );

      await expect(testScript).rejects.toThrow(PixRefundInvalidStateException);
      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(0);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not save refund if associated devolution received or deposit does not exist', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDepositByEndToEndIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
      } = makeSut();

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(null);
      mockGetDepositByEndToEndIdRepository.mockResolvedValueOnce(null);
      mockGetDevolutionReceivedByEndToEndIdRepository.mockResolvedValueOnce(
        null,
      );

      const {
        id,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      } = refund;

      const testScript = () =>
        sut.execute(
          id,
          null,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        );

      await expect(testScript).rejects.toThrow(PixTransactionNotFoundException);

      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not save refund if associated infraction does not exist', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDepositByEndToEndIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CLOSED_CONFIRMED,
        },
      );

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(null);
      mockGetInfractionByIdRepository.mockResolvedValueOnce(null);

      const {
        id,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      } = refund;

      const testScript = () =>
        sut.execute(
          id,
          infraction.infractionPspId,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        );

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);

      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not save refund if associated infraction has invalid state', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockGetDepositByEndToEndIdRepository,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.OPEN_CONFIRMED,
        },
      );

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(null);
      mockGetInfractionByIdRepository.mockResolvedValueOnce(infraction);

      const {
        id,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      } = refund;

      const testScript = () =>
        sut.execute(
          id,
          infraction.infractionPspId,
          contested,
          amount,
          description,
          reason,
          requesterBank,
          responderBank,
          status,
          transaction,
          solicitationPspId,
        );

      await expect(testScript).rejects.toThrow(
        PixInfractionInvalidStateException,
      );

      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(0);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(0);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should save refund transaction deposit successfully with infraction Id', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDepositByEndToEndIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
        mockUpdateInfractionRepository,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CLOSED_CONFIRMED,
          analysisResult: PixInfractionAnalysisResultType.AGREED,
        },
      );

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
          {
            pixInfraction: infraction,
          },
        );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(null);
      mockGetInfractionByIdRepository.mockResolvedValueOnce(infraction);
      mockGetDepositByEndToEndIdRepository.mockResolvedValue(deposit);
      mockGetDevolutionReceivedByEndToEndIdRepository.mockResolvedValue(null);
      mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const {
        id,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      } = refund;

      const result = await sut.execute(
        id,
        infraction.infractionPspId,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should save refund transaction devolution received successfully with infraction Id', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDepositByEndToEndIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
        mockUpdateInfractionRepository,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CLOSED_CONFIRMED,
          analysisResult: PixInfractionAnalysisResultType.AGREED,
        },
      );

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
      );

      const devolutionReceived =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      const pixInfractionRefundOperation =
        await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationEntity>(
          PixInfractionRefundOperationEntity.name,
          {
            pixInfraction: infraction,
          },
        );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(null);
      mockGetInfractionByIdRepository.mockResolvedValueOnce(infraction);
      mockGetDepositByEndToEndIdRepository.mockResolvedValue(null);
      mockGetDevolutionReceivedByEndToEndIdRepository.mockResolvedValue(
        devolutionReceived,
      );
      mockGetAllPixInfractionRefundOperationByFilter.mockResolvedValue([
        pixInfractionRefundOperation,
      ]);

      const {
        id,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      } = refund;

      const result = await sut.execute(
        id,
        infraction.infractionPspId,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0009 - Should save refund transaction devolution received successfully without infraction Id (block account)', async () => {
      const {
        sut,
        mockGetPixRefundBySolicitationIdRepository,
        mockCreatePixRefundRepository,
        mockGetInfractionByIdRepository,
        mockGetDepositByEndToEndIdRepository,
        mockGetDevolutionReceivedByEndToEndIdRepository,
        mockReceivePendingPixRefundEvent,
        mockCreateOperationService,
        mockGetOperationService,
        mockGetWalletByUserAndDefaultIsTrue,
        mockGetAllPixInfractionRefundOperationByFilter,
        mockUpdatePixInfractionRefundOperation,
        mockCreatePixInfractionRefundOperation,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = pixPaymentOperationRefundTransactionTag;

      const refund = await PixRefundFactory.create<PixRefundEntity>(
        PixRefundEntity.name,
        { infraction: null, operation },
      );

      const devolutionReceived =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetPixRefundBySolicitationIdRepository.mockResolvedValueOnce(null);
      mockGetDepositByEndToEndIdRepository.mockResolvedValue(null);
      mockGetDevolutionReceivedByEndToEndIdRepository.mockResolvedValue(
        devolutionReceived,
      );
      mockGetWalletByUserAndDefaultIsTrue.mockResolvedValue(wallet);
      mockGetOperationService.mockResolvedValueOnce(
        devolutionReceived.operation,
      );
      mockCreateOperationService.mockResolvedValueOnce(refund.operation);

      const {
        id,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      } = refund;

      const result = await sut.execute(
        id,
        null,
        contested,
        amount,
        description,
        reason,
        requesterBank,
        responderBank,
        status,
        transaction,
        solicitationPspId,
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      expect(mockGetPixRefundBySolicitationIdRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCreatePixRefundRepository).toHaveBeenCalledTimes(1);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(
        mockGetDevolutionReceivedByEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingPixRefundEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(
        mockGetAllPixInfractionRefundOperationByFilter,
      ).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
    });
  });
});
