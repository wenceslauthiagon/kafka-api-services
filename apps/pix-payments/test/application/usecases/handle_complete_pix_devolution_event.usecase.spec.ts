import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositRepository,
  PixDevolutionEntity,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandleCompletePixDevolutionEventUseCase as UseCase,
  PixDevolutionEventEmitter,
  OperationService,
  PixDevolutionInvalidStateException,
  PixDevolutionNotFoundException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('HandleCompletePixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());
  const pixDevolutionTransactionTag = 'PIXDEVSEND';

  const makeSut = () => {
    const {
      devolutionRepository,
      depositRepository,
      mockUpdatePixDevolutionRepository,
      mockGetByIdPixDevolutionRepository,
      mockGetByIdPixDepositRepository,
    } = mockRepository();

    const { eventEmitter, mockConfirmedEventEmitter } = mockEmitter();

    const {
      operationService,
      mockAcceptOperationService,
      mockGetOperationById,
    } = mockService();

    const sut = new UseCase(
      logger,
      devolutionRepository,
      eventEmitter,
      operationService,
      depositRepository,
      pixDevolutionTransactionTag,
    );
    return {
      sut,
      mockUpdatePixDevolutionRepository,
      mockGetByIdPixDevolutionRepository,
      mockConfirmedEventEmitter,
      mockAcceptOperationService,
      mockGetOperationById,
      mockGetByIdPixDepositRepository,
    };
  };

  const mockRepository = () => {
    const devolutionRepository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockUpdatePixDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.update));
    const mockGetByIdPixDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.getById));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetByIdPixDepositRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getById));

    return {
      devolutionRepository,
      depositRepository,
      mockUpdatePixDevolutionRepository,
      mockGetByIdPixDevolutionRepository,
      mockGetByIdPixDepositRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixDevolutionEventEmitter =
      createMock<PixDevolutionEventEmitter>();
    const mockConfirmedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.confirmedDevolution),
    );

    return {
      eventEmitter,
      mockConfirmedEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockAcceptOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.acceptOperation),
    );
    const mockGetOperationById: jest.Mock = On(operationService).get(
      method((mock) => mock.getOperationById),
    );

    return {
      operationService,
      mockAcceptOperationService,
      mockGetOperationById,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not handle complete when id is null', async () => {
      const { sut } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should not handle complete when devolution not found', async () => {
      const { sut, mockGetByIdPixDevolutionRepository } = makeSut();
      mockGetByIdPixDevolutionRepository.mockResolvedValue(null);

      const id = uuidV4();
      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PixDevolutionNotFoundException);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledWith(id);
    });

    it('TC0003 - Should not handle complete when devolution is already completed', async () => {
      const { sut, mockGetByIdPixDevolutionRepository } = makeSut();
      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.CONFIRMED },
      );
      mockGetByIdPixDevolutionRepository.mockResolvedValue(devolution);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixDevolutionState.CONFIRMED);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
    });

    it('TC0004 - Should not handle pending failed when status is not waiting', async () => {
      const { sut, mockGetByIdPixDevolutionRepository } = makeSut();
      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.CANCELED },
      );
      mockGetByIdPixDevolutionRepository.mockResolvedValue(devolution);

      const testScript = () => sut.execute(devolution.id);

      expect(testScript).rejects.toThrow(PixDevolutionInvalidStateException);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should handle complete devolution and accept operation', async () => {
      const {
        sut,
        mockGetByIdPixDevolutionRepository,
        mockUpdatePixDevolutionRepository,
        mockAcceptOperationService,
        mockConfirmedEventEmitter,
        mockGetOperationById,
        mockGetByIdPixDepositRepository,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.WAITING },
      );

      mockGetByIdPixDevolutionRepository.mockResolvedValue(devolution);
      mockGetOperationById.mockResolvedValue(devolution.operation);
      mockGetByIdPixDepositRepository.mockResolvedValue(deposit);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixDevolutionState.CONFIRMED);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should handle complete failed pix devolution and accept operation', async () => {
      const {
        sut,
        mockGetByIdPixDevolutionRepository,
        mockUpdatePixDevolutionRepository,
        mockAcceptOperationService,
        mockConfirmedEventEmitter,
        mockGetOperationById,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.WAITING },
      );

      mockGetByIdPixDevolutionRepository.mockResolvedValue(devolution);
      mockGetOperationById.mockResolvedValue(null);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixDevolutionState.CONFIRMED);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdPixDevolutionRepository).toHaveBeenCalledWith(
        devolution.id,
      );
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
    });
  });
});
