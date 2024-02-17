import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PaymentRepository,
  PixDepositEntity,
  PixDevolutionEntity,
  PixDevolutionRepository,
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionTransactionType,
} from '@zro/pix-payments/domain';
import {
  HandleOpenPendingPixInfractionEventUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
  PixInfractionGateway,
  IssueInfractionGateway,
  PixInfractionInvalidStateException,
  PixTransactionNotFoundException,
} from '@zro/pix-payments/application';
import {
  InfractionFactory,
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('HandleOpenPendingInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockGateway = () => {
    const pspGateway: PixInfractionGateway = createMock<PixInfractionGateway>();
    const mockCreateInfractionPspGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createInfraction),
    );

    const infractionGateway: IssueInfractionGateway =
      createMock<IssueInfractionGateway>();
    const mockUpdateInfractionGateway: jest.Mock = On(infractionGateway).get(
      method((mock) => mock.updateInfraction),
    );

    return {
      pspGateway,
      mockCreateInfractionPspGateway,
      infractionGateway,
      mockUpdateInfractionGateway,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockOpenConfirmedInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.openConfirmedInfraction),
    );

    return {
      eventEmitter,
      mockOpenConfirmedInfractionEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));
    const mockGetInfractionByIdRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getById));

    const paymentRepository: PaymentRepository =
      createMock<PaymentRepository>();
    const mockGetPaymentRepository: jest.Mock = On(paymentRepository).get(
      method((mock) => mock.getById),
    );

    const devolutionRepository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockGetDevolutionWithDepositRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.getWithDepositById));

    return {
      infractionRepository,
      paymentRepository,
      devolutionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIdRepository,
      mockGetPaymentRepository,
      mockGetDevolutionWithDepositRepository,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIdRepository,
      paymentRepository,
      devolutionRepository,
      mockGetPaymentRepository,
      mockGetDevolutionWithDepositRepository,
    } = mockRepository();

    const { eventEmitter, mockOpenConfirmedInfractionEvent } = mockEmitter();

    const {
      pspGateway,
      mockCreateInfractionPspGateway,
      infractionGateway,
      mockUpdateInfractionGateway,
    } = mockGateway();

    const sut = new UseCase(
      logger,
      infractionRepository,
      pspGateway,
      infractionGateway,
      eventEmitter,
      paymentRepository,
      devolutionRepository,
    );
    return {
      sut,
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIdRepository,
      mockOpenConfirmedInfractionEvent,
      mockUpdateInfractionGateway,
      mockCreateInfractionPspGateway,
      mockGetPaymentRepository,
      mockGetDevolutionWithDepositRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdateInfractionGateway,
        mockCreateInfractionPspGateway,
        mockOpenConfirmedInfractionEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionPspGateway).toHaveBeenCalledTimes(0);
      expect(mockOpenConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if infraction not exists', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdateInfractionGateway,
        mockCreateInfractionPspGateway,
        mockOpenConfirmedInfractionEvent,
      } = makeSut();
      const { id } = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );
      mockGetInfractionByIdRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionPspGateway).toHaveBeenCalledTimes(0);
      expect(mockOpenConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if infraction state is invalid', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdateInfractionGateway,
        mockCreateInfractionPspGateway,
        mockOpenConfirmedInfractionEvent,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          transactionType: PixInfractionTransactionType.PAYMENT,
          state: PixInfractionState.ACKNOWLEDGED_CONFIRMED,
        },
      );

      mockGetInfractionByIdRepository.mockResolvedValue(infraction);

      const testScript = () => sut.execute(infraction.id);

      await expect(testScript).rejects.toThrow(
        PixInfractionInvalidStateException,
      );
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionPspGateway).toHaveBeenCalledTimes(0);
      expect(mockOpenConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 -Should not update when transaction not found', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdateInfractionGateway,
        mockCreateInfractionPspGateway,
        mockOpenConfirmedInfractionEvent,
        mockGetPaymentRepository,
        mockGetDevolutionWithDepositRepository,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          transactionType: PixInfractionTransactionType.PAYMENT,
          state: PixInfractionState.OPEN_PENDING,
          status: PixInfractionStatus.OPENED,
        },
      );

      mockGetInfractionByIdRepository.mockResolvedValueOnce(infraction);
      mockGetPaymentRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(infraction.id);

      await expect(testScript).rejects.toThrow(PixTransactionNotFoundException);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionPspGateway).toHaveBeenCalledTimes(0);
      expect(mockOpenConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionWithDepositRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - should create infraction successfully with payment', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdateInfractionGateway,
        mockCreateInfractionPspGateway,
        mockOpenConfirmedInfractionEvent,
        mockGetPaymentRepository,
        mockGetDevolutionWithDepositRepository,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          transactionType: PixInfractionTransactionType.PAYMENT,
          state: PixInfractionState.OPEN_PENDING,
          status: PixInfractionStatus.OPENED,
        },
      );

      mockGetInfractionByIdRepository.mockResolvedValueOnce(infraction);
      mockUpdateInfractionRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.OPENED);
      expect(result.state).toEqual(PixInfractionState.OPEN_CONFIRMED);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionPspGateway).toHaveBeenCalledTimes(1);
      expect(mockOpenConfirmedInfractionEvent).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDevolutionWithDepositRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - should create infraction successfully with devolution', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdateInfractionGateway,
        mockCreateInfractionPspGateway,
        mockOpenConfirmedInfractionEvent,
        mockGetPaymentRepository,
        mockGetDevolutionWithDepositRepository,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          transactionType: PixInfractionTransactionType.DEVOLUTION,
          state: PixInfractionState.OPEN_PENDING,
          status: PixInfractionStatus.OPENED,
        },
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );
      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { deposit },
      );

      mockGetInfractionByIdRepository.mockResolvedValueOnce(infraction);
      mockUpdateInfractionRepository.mockResolvedValue(infraction);
      mockGetDevolutionWithDepositRepository.mockResolvedValue(devolution);

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.OPENED);
      expect(result.state).toEqual(PixInfractionState.OPEN_CONFIRMED);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionPspGateway).toHaveBeenCalledTimes(1);
      expect(mockOpenConfirmedInfractionEvent).toHaveBeenCalledTimes(1);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionWithDepositRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - should infraction successfully when already OPEN_CONFIRMED', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdateInfractionGateway,
        mockCreateInfractionPspGateway,
        mockOpenConfirmedInfractionEvent,
        mockGetPaymentRepository,
        mockGetDevolutionWithDepositRepository,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          transactionType: PixInfractionTransactionType.PAYMENT,
          state: PixInfractionState.OPEN_CONFIRMED,
          status: PixInfractionStatus.OPENED,
        },
      );

      mockGetInfractionByIdRepository.mockResolvedValueOnce(infraction);

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.OPENED);
      expect(result.state).toEqual(PixInfractionState.OPEN_CONFIRMED);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionPspGateway).toHaveBeenCalledTimes(0);
      expect(mockOpenConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetPaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDevolutionWithDepositRepository).toHaveBeenCalledTimes(0);
    });
  });
});
