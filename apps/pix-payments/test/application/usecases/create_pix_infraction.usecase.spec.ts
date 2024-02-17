import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionStatus,
  PaymentRepository,
  PixDevolutionRepository,
  PixInfractionState,
} from '@zro/pix-payments/domain';
import {
  CreatePixInfractionUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionInvalidStateException,
  PixTransactionNotFoundException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('CreateInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockNewInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.newInfraction),
    );

    return {
      eventEmitter,
      mockNewInfractionEvent,
    };
  };

  const mockRepository = () => {
    const paymentRepository: PaymentRepository =
      createMock<PaymentRepository>();
    const mockGetByOperationPaymentRepository: jest.Mock = On(
      paymentRepository,
    ).get(method((mock) => mock.getByOperation));

    const devolutionRepository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockGetByOperationDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.getByOperation));

    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockCreateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.create));
    const mockGetInfractionRepository: jest.Mock = On(infractionRepository).get(
      method((mock) => mock.getByIssueId),
    );

    return {
      paymentRepository,
      mockGetByOperationPaymentRepository,
      infractionRepository,
      mockCreateInfractionRepository,
      devolutionRepository,
      mockGetByOperationDevolutionRepository,
      mockGetInfractionRepository,
    };
  };

  const makeSut = () => {
    const {
      paymentRepository,
      mockGetByOperationPaymentRepository,
      infractionRepository,
      mockCreateInfractionRepository,
      devolutionRepository,
      mockGetByOperationDevolutionRepository,
      mockGetInfractionRepository,
    } = mockRepository();
    const { eventEmitter, mockNewInfractionEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      paymentRepository,
      infractionRepository,
      eventEmitter,
      devolutionRepository,
    );
    return {
      sut,
      mockGetByOperationPaymentRepository,
      infractionRepository,
      mockCreateInfractionRepository,
      mockNewInfractionEvent,
      mockGetByOperationDevolutionRepository,
      mockGetInfractionRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetByOperationPaymentRepository,
        mockCreateInfractionRepository,
        mockNewInfractionEvent,
        mockGetByOperationDevolutionRepository,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByOperationPaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockNewInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDevolutionRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if infraction invalid state', async () => {
      const {
        sut,
        mockGetByOperationPaymentRepository,
        mockCreateInfractionRepository,
        mockNewInfractionEvent,
        mockGetByOperationDevolutionRepository,
        mockGetInfractionRepository,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );
      mockGetInfractionRepository.mockResolvedValue(null);
      mockGetByOperationPaymentRepository.mockResolvedValue(null);
      mockGetByOperationDevolutionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(infraction);

      await expect(testScript).rejects.toThrow(
        PixInfractionInvalidStateException,
      );
      expect(mockGetByOperationPaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockNewInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDevolutionRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if transaction not found', async () => {
      const {
        sut,
        mockGetByOperationPaymentRepository,
        mockCreateInfractionRepository,
        mockNewInfractionEvent,
        mockGetByOperationDevolutionRepository,
        mockGetInfractionRepository,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { status: PixInfractionStatus.NEW },
      );
      mockGetInfractionRepository.mockResolvedValue(null);
      mockGetByOperationPaymentRepository.mockResolvedValue(null);
      mockGetByOperationDevolutionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(infraction);

      await expect(testScript).rejects.toThrow(PixTransactionNotFoundException);
      expect(mockGetByOperationPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockNewInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDevolutionRepository).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - should create infraction successfully', async () => {
      const {
        sut,
        mockGetByOperationPaymentRepository,
        mockCreateInfractionRepository,
        mockNewInfractionEvent,
        mockGetByOperationDevolutionRepository,
        mockGetInfractionRepository,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { status: PixInfractionStatus.NEW },
      );
      mockGetInfractionRepository.mockResolvedValue(null);

      const result = await sut.execute(infraction);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.NEW);
      expect(result.state).toEqual(PixInfractionState.NEW_CONFIRMED);
      expect(mockGetByOperationPaymentRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockNewInfractionEvent).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationDevolutionRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - should infraction successfully if already exists', async () => {
      const {
        sut,
        mockGetByOperationPaymentRepository,
        mockCreateInfractionRepository,
        mockNewInfractionEvent,
        mockGetByOperationDevolutionRepository,
        mockGetInfractionRepository,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          status: PixInfractionStatus.NEW,
          state: PixInfractionState.NEW_CONFIRMED,
        },
      );
      mockGetInfractionRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.NEW);
      expect(result.state).toEqual(PixInfractionState.NEW_CONFIRMED);
      expect(mockGetByOperationPaymentRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockNewInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetInfractionRepository).toHaveBeenCalledTimes(1);
    });
  });
});
