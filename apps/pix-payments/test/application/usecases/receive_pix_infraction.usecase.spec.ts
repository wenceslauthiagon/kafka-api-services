import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixDepositEntity,
  PixInfractionType,
  PixInfractionStatus,
  PixDevolutionReceivedEntity,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  OperationEntity,
  WalletEntity,
  WalletState,
} from '@zro/operations/domain';
import {
  HandleReceivePixInfractionEventUseCase as UseCase,
  PixInfractionEventEmitter,
  PixTransactionNotFoundException,
  OperationService,
} from '@zro/pix-payments/application';
import {
  InfractionFactory,
  PixDepositFactory,
  PixDevolutionReceivedFactory,
} from '@zro/test/pix-payments/config';
import { OperationFactory, WalletFactory } from '@zro/test/operations/config';

describe('ReceiveInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockReceivePendingInfractionReceivedEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.receivePendingInfraction));

    return {
      eventEmitter,
      mockReceivePendingInfractionReceivedEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));
    const mockGetInfractionByPspIdRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getByInfractionPspId));
    const mockCreateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.create));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetDepositByIdOrEndToEndIdRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getByIdOrEndToEndId));

    const devolutionReceivedRepository: PixDevolutionReceivedRepository =
      createMock<PixDevolutionReceivedRepository>();
    const mockGetDevolutionReceivedByIdOrEndToEndIdRepository: jest.Mock = On(
      devolutionReceivedRepository,
    ).get(method((mock) => mock.getByIdOrEndToEndId));

    const pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository =
      createMock<PixInfractionRefundOperationRepository>();
    const mockCreatePixInfractionRefundOperation: jest.Mock = On(
      pixInfractionRefundOperationRepository,
    ).get(method((mock) => mock.create));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByPspIdRepository,
      mockCreateInfractionRepository,
      depositRepository,
      mockGetDepositByIdOrEndToEndIdRepository,
      devolutionReceivedRepository,
      mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      pixInfractionRefundOperationRepository,
      mockCreatePixInfractionRefundOperation,
    };
  };

  const makeSut = () => {
    const pixPaymentOperationCurrencyTag = 'REAL';
    const pixPaymentOperationInfractionTransactionTag = 'TRANSREC';

    const {
      infractionRepository,
      mockGetInfractionByPspIdRepository,
      mockUpdateInfractionRepository,
      mockCreateInfractionRepository,
      depositRepository,
      mockGetDepositByIdOrEndToEndIdRepository,
      devolutionReceivedRepository,
      mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      pixInfractionRefundOperationRepository,
      mockCreatePixInfractionRefundOperation,
    } = mockRepository();

    const { eventEmitter, mockReceivePendingInfractionReceivedEvent } =
      mockEmitter();

    const operationService: OperationService = createMock<OperationService>();
    const mockGetWalletByUserAndDefaultIsTrue: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletByUserAndDefaultIsTrue));
    const mockCreateOperation: jest.Mock = On(operationService).get(
      method((mock) => mock.createOperation),
    );
    const mockGetOperationById: jest.Mock = On(operationService).get(
      method((mock) => mock.getOperationById),
    );

    const sut = new UseCase(
      logger,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
      operationService,
      pixPaymentOperationCurrencyTag,
      pixPaymentOperationInfractionTransactionTag,
    );

    return {
      sut,
      mockGetInfractionByPspIdRepository,
      infractionRepository,
      mockUpdateInfractionRepository,
      mockCreateInfractionRepository,
      mockReceivePendingInfractionReceivedEvent,
      mockGetDepositByIdOrEndToEndIdRepository,
      mockGetWalletByUserAndDefaultIsTrue,
      mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      mockCreatePixInfractionRefundOperation,
      mockCreateOperation,
      mockGetOperationById,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should save infraction successfully', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockCreateInfractionRepository,
        mockReceivePendingInfractionReceivedEvent,
        mockGetDepositByIdOrEndToEndIdRepository,
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
        mockCreatePixInfractionRefundOperation,
        mockCreateOperation,
        mockGetOperationById,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          status: PixInfractionStatus.ACKNOWLEDGED,
        },
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );
      const reportDetails = 'test';
      const {
        id,
        transaction,
        creationDate,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
      } = infraction;

      mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValue(deposit);
      mockGetInfractionByPspIdRepository.mockResolvedValue(null);

      const result = await sut.execute(
        id,
        creationDate,
        reportDetails,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
        transaction.id,
      );

      expect(result).toBeDefined();
      expect(result.state).toBe(PixInfractionState.RECEIVE_PENDING);

      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingInfractionReceivedEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should save infraction successfully when operationTransactionId is missing', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockCreateInfractionRepository,
        mockReceivePendingInfractionReceivedEvent,
        mockGetDepositByIdOrEndToEndIdRepository,
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          status: PixInfractionStatus.ACKNOWLEDGED,
        },
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const receivedDevolution =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      const reportDetails = 'test';
      const {
        id,
        creationDate,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
      } = infraction;

      mockGetInfractionByPspIdRepository.mockResolvedValue(null);
      mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValue(deposit);
      mockGetDevolutionReceivedByIdOrEndToEndIdRepository.mockResolvedValue(
        receivedDevolution,
      );

      const result = await sut.execute(
        id,
        creationDate,
        reportDetails,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
        null,
      );

      expect(result).toBeDefined();
      expect(result.state).toBe(PixInfractionState.RECEIVE_PENDING);

      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingInfractionReceivedEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should save infraction successfully when operationTransactionId not found', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockCreateInfractionRepository,
        mockReceivePendingInfractionReceivedEvent,
        mockGetDepositByIdOrEndToEndIdRepository,
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          status: PixInfractionStatus.ACKNOWLEDGED,
        },
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const receivedDevolution =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
        );

      const reportDetails = 'test';
      const {
        id,
        creationDate,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
        transaction,
      } = infraction;

      mockGetInfractionByPspIdRepository.mockResolvedValue(null);
      mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValue(null);
      mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValue(deposit);
      mockGetDevolutionReceivedByIdOrEndToEndIdRepository.mockResolvedValue(
        receivedDevolution,
      );

      const result = await sut.execute(
        id,
        creationDate,
        reportDetails,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
        transaction.id,
      );

      expect(result).toBeDefined();
      expect(result.state).toBe(PixInfractionState.RECEIVE_PENDING);
      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingInfractionReceivedEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should return infraction if it already exists', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockCreateInfractionRepository,
        mockReceivePendingInfractionReceivedEvent,
        mockGetDepositByIdOrEndToEndIdRepository,
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
        mockCreatePixInfractionRefundOperation,
        mockCreateOperation,
        mockGetOperationById,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );

      mockGetInfractionByPspIdRepository.mockResolvedValueOnce(infraction);
      const reportDetails = 'test';
      const {
        id,
        transaction,
        creationDate,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
      } = infraction;

      const result = await sut.execute(
        id,
        creationDate,
        reportDetails,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
        transaction.id,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(infraction);

      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePendingInfractionReceivedEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should save infraction and create lock operation successfully', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockCreateInfractionRepository,
        mockReceivePendingInfractionReceivedEvent,
        mockGetDepositByIdOrEndToEndIdRepository,
        mockGetWalletByUserAndDefaultIsTrue,
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
        mockCreatePixInfractionRefundOperation,
        mockCreateOperation,
        mockGetOperationById,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          infractionType: PixInfractionType.REFUND_REQUEST,
          status: PixInfractionStatus.ACKNOWLEDGED,
        },
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const reportDetails = 'test';
      const {
        id,
        transaction,
        creationDate,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
      } = infraction;

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValue(deposit);
      const refundOperation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValue(deposit);
      mockGetDevolutionReceivedByIdOrEndToEndIdRepository.mockResolvedValue(
        null,
      );
      mockGetInfractionByPspIdRepository.mockResolvedValue(null);
      mockGetWalletByUserAndDefaultIsTrue.mockResolvedValue(wallet);
      mockCreateOperation.mockResolvedValue(refundOperation);
      mockGetOperationById.mockResolvedValue(deposit.operation);

      const result = await sut.execute(
        id,
        creationDate,
        reportDetails,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
        transaction.id,
      );

      expect(result).toBeDefined();
      expect(result.state).toBe(PixInfractionState.RECEIVE_PENDING);

      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockReceivePendingInfractionReceivedEvent).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateOperation).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0006 - Should not save infraction if there are missing params', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockCreateInfractionRepository,
        mockReceivePendingInfractionReceivedEvent,
        mockGetDepositByIdOrEndToEndIdRepository,
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
        mockCreatePixInfractionRefundOperation,
        mockCreateOperation,
        mockGetOperationById,
      } = makeSut();

      const reportDetails = 'test';
      const {
        transaction,
        creationDate,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
      } = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );

      const testScript = () =>
        sut.execute(
          null,
          creationDate,
          reportDetails,
          endToEndId,
          infractionPspId,
          infractionType,
          isReporter,
          ispb,
          ispbCreditedParticipant,
          ispbDebitedParticipant,
          lastChangeDate,
          reportBy,
          status,
          transaction.id,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePendingInfractionReceivedEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not save infraction if associated transaction does not exist', async () => {
      const {
        sut,
        mockCreateInfractionRepository,
        mockReceivePendingInfractionReceivedEvent,
        mockGetInfractionByPspIdRepository,
        mockGetDepositByIdOrEndToEndIdRepository,
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
        mockCreatePixInfractionRefundOperation,
        mockCreateOperation,
        mockGetOperationById,
      } = makeSut();

      const reportDetails = 'test';
      const {
        id,
        transaction,
        creationDate,
        endToEndId,
        infractionPspId,
        infractionType,
        isReporter,
        ispb,
        ispbCreditedParticipant,
        ispbDebitedParticipant,
        lastChangeDate,
        reportBy,
        status,
      } = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          status: PixInfractionStatus.ACKNOWLEDGED,
        },
      );

      mockGetInfractionByPspIdRepository.mockResolvedValueOnce(null);
      mockGetDepositByIdOrEndToEndIdRepository.mockResolvedValueOnce(null);
      mockGetDevolutionReceivedByIdOrEndToEndIdRepository.mockResolvedValueOnce(
        null,
      );

      const testScript = () =>
        sut.execute(
          id,
          creationDate,
          reportDetails,
          endToEndId,
          infractionPspId,
          infractionType,
          isReporter,
          ispb,
          ispbCreditedParticipant,
          ispbDebitedParticipant,
          lastChangeDate,
          reportBy,
          status,
          transaction.id,
        );

      await expect(testScript).rejects.toThrow(PixTransactionNotFoundException);

      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdOrEndToEndIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockReceivePendingInfractionReceivedEvent).toHaveBeenCalledTimes(
        0,
      );
      expect(
        mockGetDevolutionReceivedByIdOrEndToEndIdRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreatePixInfractionRefundOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
    });
  });
});
