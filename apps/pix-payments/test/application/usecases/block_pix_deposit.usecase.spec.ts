import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  PixDepositEntity,
  PixDepositState,
  WarningPixDepositRepository,
  WarningPixDepositState,
  WarningPixDepositEntity,
} from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity, OperationState } from '@zro/operations/domain';
import {
  BlockPixDepositUseCase as UseCase,
  PixDepositEventEmitter,
  PixDepositNotFoundException,
  OperationService,
  WarningPixDepositNotFoundException,
  PixDepositReceivedInvalidStateException,
  WarningPixDepositInvalidStateException,
  WarningPixDevolutionEventEmitter,
} from '@zro/pix-payments/application';
import { OperationNotFoundException } from '@zro/operations/application';
import {
  PixDepositFactory,
  WarningPixDepositFactory,
} from '@zro/test/pix-payments/config';
import { UserFactory } from '@zro/test/users/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('BlockPixDepositUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const pixEventEmitter: PixDepositEventEmitter =
      createMock<PixDepositEventEmitter>();
    const mockBlockedDepositEvent: jest.Mock = On(pixEventEmitter).get(
      method((mock) => mock.blockedDeposit),
    );

    const warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitter =
      createMock<WarningPixDevolutionEventEmitter>();
    const mockCreateWarningPixDevolution: jest.Mock = On(
      warningPixDevolutionEventEmitter,
    ).get(method((mock) => mock.createWarningPixDevolution));

    return {
      pixEventEmitter,
      mockBlockedDepositEvent,
      warningPixDevolutionEventEmitter,
      mockCreateWarningPixDevolution,
    };
  };

  const mockRepository = () => {
    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetByOperationDepositRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getByOperation));
    const mockUpdateDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.update),
    );

    const warningPixDepositRepository: WarningPixDepositRepository =
      createMock<WarningPixDepositRepository>();
    const mockGetWarningPixDepositByOperation: jest.Mock = On(
      warningPixDepositRepository,
    ).get(method((mock) => mock.getByOperation));
    const mockUpdateWarningPixDeposit: jest.Mock = On(
      warningPixDepositRepository,
    ).get(method((mock) => mock.update));

    return {
      depositRepository,
      mockGetByOperationDepositRepository,
      mockUpdateDepositRepository,
      warningPixDepositRepository,
      mockGetWarningPixDepositByOperation,
      mockUpdateWarningPixDeposit,
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

  const makeSut = () => {
    const {
      operationService,
      mockAcceptOperationService,
      mockGetOperationById,
    } = mockService();

    const {
      depositRepository,
      mockGetByOperationDepositRepository,
      mockUpdateDepositRepository,
      warningPixDepositRepository,
      mockGetWarningPixDepositByOperation,
      mockUpdateWarningPixDeposit,
    } = mockRepository();

    const {
      pixEventEmitter,
      mockBlockedDepositEvent,
      warningPixDevolutionEventEmitter,
      mockCreateWarningPixDevolution,
    } = mockEmitter();

    const sut = new UseCase(
      logger,
      depositRepository,
      warningPixDepositRepository,
      operationService,
      pixEventEmitter,
      warningPixDevolutionEventEmitter,
    );

    return {
      sut,
      mockAcceptOperationService,
      mockGetOperationById,
      mockGetByOperationDepositRepository,
      mockGetWarningPixDepositByOperation,
      mockUpdateWarningPixDeposit,
      mockBlockedDepositEvent,
      mockUpdateDepositRepository,
      mockCreateWarningPixDevolution,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - should approve warning pix deposit', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetOperationById,
        mockGetByOperationDepositRepository,
        mockGetWarningPixDepositByOperation,
        mockUpdateWarningPixDeposit,
        mockBlockedDepositEvent,
        mockUpdateDepositRepository,
        mockCreateWarningPixDevolution,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
        },
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          id: pixDeposit.operation.id,
          state: OperationState.PENDING,
        },
      );

      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          {
            operation,
            state: WarningPixDepositState.CREATED,
          },
        );

      mockGetOperationById.mockResolvedValue(operation);
      mockGetByOperationDepositRepository.mockResolvedValue(pixDeposit);
      mockGetWarningPixDepositByOperation.mockResolvedValue(warningPixDeposit);

      const result = await sut.execute(pixDeposit);

      expect(result).toBeDefined;
      expect(result.state).toBe(PixDepositState.BLOCKED);
      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockBlockedDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(1);
      expect(pixDeposit.state).toBe(PixDepositState.BLOCKED);
      expect(warningPixDeposit.state).toBe(WarningPixDepositState.APPROVED);
      expect(mockCreateWarningPixDevolution).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException if there are missing data', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetOperationById,
        mockGetByOperationDepositRepository,
        mockGetWarningPixDepositByOperation,
        mockUpdateWarningPixDeposit,
        mockBlockedDepositEvent,
        mockUpdateDepositRepository,
        mockCreateWarningPixDevolution,
      } = makeSut();

      const pixDeposits = [
        null,
        await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            operation: null,
          },
        ),
        await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            operation: new OperationEntity({
              id: null,
              beneficiary: await UserFactory.create<UserEntity>(
                UserEntity.name,
              ),
            }),
          },
        ),
      ];

      for (const pixDeposit of pixDeposits) {
        const testScript = () => sut.execute(pixDeposit);
        await expect(testScript).rejects.toThrow(MissingDataException);
      }

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockBlockedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolution).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw OperationNotFoundException if no operation is found', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetOperationById,
        mockGetByOperationDepositRepository,
        mockGetWarningPixDepositByOperation,
        mockUpdateWarningPixDeposit,
        mockBlockedDepositEvent,
        mockUpdateDepositRepository,
        mockCreateWarningPixDevolution,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetOperationById.mockResolvedValue(undefined);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(OperationNotFoundException);

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockBlockedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolution).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw PixDepositNotFoundException if pix deposit is not found', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetOperationById,
        mockGetByOperationDepositRepository,
        mockGetWarningPixDepositByOperation,
        mockUpdateWarningPixDeposit,
        mockBlockedDepositEvent,
        mockUpdateDepositRepository,
        mockCreateWarningPixDevolution,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          id: pixDeposit.operation.id,
        },
      );

      mockGetOperationById.mockResolvedValue(operation);
      mockGetByOperationDepositRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockBlockedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolution).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw WarningPixDepositNotFoundException if no warning pix deposit is found', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetOperationById,
        mockGetByOperationDepositRepository,
        mockGetWarningPixDepositByOperation,
        mockUpdateWarningPixDeposit,
        mockBlockedDepositEvent,
        mockUpdateDepositRepository,
        mockCreateWarningPixDevolution,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          id: pixDeposit.operation.id,
        },
      );

      mockGetOperationById.mockResolvedValue(operation);
      mockGetByOperationDepositRepository.mockResolvedValue(pixDeposit);
      mockGetWarningPixDepositByOperation.mockResolvedValue(undefined);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(
        WarningPixDepositNotFoundException,
      );

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockBlockedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolution).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw PixDepositReceivedInvalidStateException if state is already blocked', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetOperationById,
        mockGetByOperationDepositRepository,
        mockGetWarningPixDepositByOperation,
        mockUpdateWarningPixDeposit,
        mockBlockedDepositEvent,
        mockUpdateDepositRepository,
        mockCreateWarningPixDevolution,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.BLOCKED,
        },
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          id: pixDeposit.operation.id,
        },
      );

      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          {
            operation,
          },
        );

      mockGetOperationById.mockResolvedValue(operation);
      mockGetByOperationDepositRepository.mockResolvedValue(pixDeposit);
      mockGetWarningPixDepositByOperation.mockResolvedValue(warningPixDeposit);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(
        PixDepositReceivedInvalidStateException,
      );

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockBlockedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolution).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should throw WarningPixDepositInvalidStateException if state is already approved', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetOperationById,
        mockGetByOperationDepositRepository,
        mockGetWarningPixDepositByOperation,
        mockUpdateWarningPixDeposit,
        mockBlockedDepositEvent,
        mockUpdateDepositRepository,
        mockCreateWarningPixDevolution,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
        },
      );

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        {
          id: pixDeposit.operation.id,
        },
      );

      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          {
            operation,
            state: WarningPixDepositState.APPROVED,
          },
        );

      mockGetOperationById.mockResolvedValue(operation);
      mockGetByOperationDepositRepository.mockResolvedValue(pixDeposit);
      mockGetWarningPixDepositByOperation.mockResolvedValue(warningPixDeposit);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(
        WarningPixDepositInvalidStateException,
      );

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockGetWarningPixDepositByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockBlockedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolution).toHaveBeenCalledTimes(0);
    });
  });
});
