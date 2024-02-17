import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionEntity,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandleRevertPixDevolutionEventUseCase as UseCase,
  OperationService,
  PixDevolutionEventEmitter,
  PixDevolutionInvalidStateException,
  PixDevolutionNotFoundException,
} from '@zro/pix-payments/application';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';

describe('HandleRevertPixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixDevolutionEventEmitter =
      createMock<PixDevolutionEventEmitter>();
    const mockFailedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.failedDevolution),
    );

    return {
      eventEmitter,
      mockFailedEventEmitter,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockRevertOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.revertOperation),
    );

    return {
      operationService,
      mockRevertOperationService,
    };
  };

  const mockRepository = () => {
    const devolutionRepository: PixDevolutionRepository =
      createMock<PixDevolutionRepository>();
    const mockUpdateDevolutionRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.update));
    const mockGetDevolutionByIdRepository: jest.Mock = On(
      devolutionRepository,
    ).get(method((mock) => mock.getById));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockUpdateDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.update),
    );
    const mockGetDepositByIdRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.getById),
    );

    return {
      devolutionRepository,
      depositRepository,
      mockUpdateDevolutionRepository,
      mockGetDevolutionByIdRepository,
      mockUpdateDepositRepository,
      mockGetDepositByIdRepository,
    };
  };

  const makeSut = () => {
    const {
      devolutionRepository,
      depositRepository,
      mockUpdateDevolutionRepository,
      mockGetDevolutionByIdRepository,
      mockUpdateDepositRepository,
      mockGetDepositByIdRepository,
    } = mockRepository();

    const { eventEmitter, mockFailedEventEmitter } = mockEmitter();

    const { operationService, mockRevertOperationService } = mockService();

    const sut = new UseCase(
      logger,
      devolutionRepository,
      depositRepository,
      eventEmitter,
      operationService,
    );

    return {
      sut,
      mockUpdateDevolutionRepository,
      mockGetDevolutionByIdRepository,
      mockUpdateDepositRepository,
      mockGetDepositByIdRepository,
      mockFailedEventEmitter,
      mockRevertOperationService,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle revert PixDevolution successfully', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetDevolutionByIdRepository,
        mockUpdateDepositRepository,
        mockGetDepositByIdRepository,
        mockFailedEventEmitter,
        mockRevertOperationService,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.PENDING },
      );

      mockGetDevolutionByIdRepository.mockResolvedValue(devolution);
      mockGetDepositByIdRepository.mockResolvedValue(devolution.deposit);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(devolution.id);
      expect(result.state).toBe(PixDevolutionState.FAILED);
      expect(mockGetDevolutionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should not handle revert PixDevolution if state is failed', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetDevolutionByIdRepository,
        mockUpdateDepositRepository,
        mockGetDepositByIdRepository,
        mockFailedEventEmitter,
        mockRevertOperationService,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.FAILED },
      );

      mockGetDevolutionByIdRepository.mockResolvedValue(devolution);

      const result = await sut.execute(devolution.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(devolution);
      expect(mockGetDevolutionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not handle revert if incorrect state', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetDevolutionByIdRepository,
        mockUpdateDepositRepository,
        mockGetDepositByIdRepository,
        mockFailedEventEmitter,
        mockRevertOperationService,
      } = makeSut();

      const devolution = await PixDevolutionFactory.create<PixDevolutionEntity>(
        PixDevolutionEntity.name,
        { state: PixDevolutionState.ERROR },
      );

      mockGetDevolutionByIdRepository.mockResolvedValue(devolution);

      const testScript = () => sut.execute(devolution.id);

      await expect(testScript).rejects.toThrow(
        PixDevolutionInvalidStateException,
      );
      expect(mockGetDevolutionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not revert if id is null', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetDevolutionByIdRepository,
        mockUpdateDepositRepository,
        mockGetDepositByIdRepository,
        mockFailedEventEmitter,
        mockRevertOperationService,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetDevolutionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not revert if id is not found', async () => {
      const {
        sut,
        mockUpdateDevolutionRepository,
        mockGetDevolutionByIdRepository,
        mockUpdateDepositRepository,
        mockGetDepositByIdRepository,
        mockFailedEventEmitter,
        mockRevertOperationService,
      } = makeSut();

      mockGetDevolutionByIdRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(uuidV4());

      await expect(testScript).rejects.toThrow(PixDevolutionNotFoundException);
      expect(mockGetDevolutionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetDepositByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockRevertOperationService).toHaveBeenCalledTimes(0);
    });
  });
});
