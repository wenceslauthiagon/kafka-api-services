import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  PixDepositEntity,
  PixDepositState,
  WarningPixDepositRepository,
  WarningPixDepositEntity,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import { OperationNotFoundException } from '@zro/operations/application';
import {
  ApprovePixDepositUseCase as UseCase,
  PixDepositEventEmitter,
  PixDepositNotFoundException,
  WarningPixDepositNotFoundException,
  OperationService,
  PixDepositReceivedInvalidStateException,
  WarningPixDepositInvalidStateException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  WarningPixDepositFactory,
} from '@zro/test/pix-payments/config';
import { UserFactory } from '@zro/test/users/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('ApprovePixDepositUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const pixEventEmitter: PixDepositEventEmitter =
      createMock<PixDepositEventEmitter>();
    const mockReceivedDepositEvent: jest.Mock = On(pixEventEmitter).get(
      method((mock) => mock.receivedDeposit),
    );

    return {
      pixEventEmitter,
      mockReceivedDepositEvent,
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
    const mockGetByOperationWarningPixDeposit: jest.Mock = On(
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
      mockGetByOperationWarningPixDeposit,
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
      mockGetByOperationWarningPixDeposit,
      mockUpdateWarningPixDeposit,
    } = mockRepository();

    const { pixEventEmitter, mockReceivedDepositEvent } = mockEmitter();

    const sut = new UseCase(
      logger,
      depositRepository,
      warningPixDepositRepository,
      operationService,
      pixEventEmitter,
    );

    return {
      sut,
      mockAcceptOperationService,
      mockGetOperationById,
      mockGetByOperationDepositRepository,
      mockGetByOperationWarningPixDeposit,
      mockUpdateWarningPixDeposit,
      mockReceivedDepositEvent,
      mockUpdateDepositRepository,
    };
  };
  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if there is missing data', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetByOperationDepositRepository,
        mockGetByOperationWarningPixDeposit,
        mockUpdateWarningPixDeposit,
        mockReceivedDepositEvent,
        mockUpdateDepositRepository,
        mockGetOperationById,
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
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockReceivedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw OperationNotFoundException if no operation is found', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetByOperationDepositRepository,
        mockGetByOperationWarningPixDeposit,
        mockUpdateWarningPixDeposit,
        mockReceivedDepositEvent,
        mockUpdateDepositRepository,
        mockGetOperationById,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
      );

      mockGetOperationById.mockResolvedValue(undefined);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(OperationNotFoundException);

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockReceivedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should throw PixDepositNotFoundException if pix deposit is not found', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetByOperationDepositRepository,
        mockGetByOperationWarningPixDeposit,
        mockUpdateWarningPixDeposit,
        mockReceivedDepositEvent,
        mockUpdateDepositRepository,
        mockGetOperationById,
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
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockReceivedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should throw WarningPixDepositNotFoundException if no warning pix deposit is found', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetByOperationDepositRepository,
        mockGetByOperationWarningPixDeposit,
        mockUpdateWarningPixDeposit,
        mockReceivedDepositEvent,
        mockUpdateDepositRepository,
        mockGetOperationById,
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
      mockGetByOperationWarningPixDeposit.mockResolvedValue(undefined);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(
        WarningPixDepositNotFoundException,
      );

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationWarningPixDeposit).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockReceivedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should throw PixDepositReceivedInvalidStateException if state is already received', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetByOperationDepositRepository,
        mockGetByOperationWarningPixDeposit,
        mockUpdateWarningPixDeposit,
        mockReceivedDepositEvent,
        mockUpdateDepositRepository,
        mockGetOperationById,
      } = makeSut();

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.RECEIVED,
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
      mockGetByOperationWarningPixDeposit.mockResolvedValue(warningPixDeposit);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(
        PixDepositReceivedInvalidStateException,
      );

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationWarningPixDeposit).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockReceivedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should throw WarningPixDepositInvalidStateException if state is already rejected', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetByOperationDepositRepository,
        mockGetByOperationWarningPixDeposit,
        mockUpdateWarningPixDeposit,
        mockReceivedDepositEvent,
        mockUpdateDepositRepository,
        mockGetOperationById,
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
            state: WarningPixDepositState.REJECTED,
          },
        );

      mockGetOperationById.mockResolvedValue(operation);
      mockGetByOperationDepositRepository.mockResolvedValue(pixDeposit);
      mockGetByOperationWarningPixDeposit.mockResolvedValue(warningPixDeposit);

      const testScript = () => sut.execute(pixDeposit);

      await expect(testScript).rejects.toThrow(
        WarningPixDepositInvalidStateException,
      );

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationWarningPixDeposit).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(0);
      expect(mockReceivedDepositEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should approve Pix Deposit successfully', async () => {
      const {
        sut,
        mockAcceptOperationService,
        mockGetByOperationDepositRepository,
        mockGetByOperationWarningPixDeposit,
        mockUpdateWarningPixDeposit,
        mockReceivedDepositEvent,
        mockUpdateDepositRepository,
        mockGetOperationById,
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
            state: WarningPixDepositState.CREATED,
          },
        );

      mockGetOperationById.mockResolvedValue(operation);
      mockGetByOperationDepositRepository.mockResolvedValue(pixDeposit);
      mockGetByOperationWarningPixDeposit.mockResolvedValue(warningPixDeposit);

      await sut.execute(pixDeposit);

      expect(mockAcceptOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationWarningPixDeposit).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningPixDeposit).toHaveBeenCalledTimes(1);
      expect(mockReceivedDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockUpdateDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(pixDeposit.state).toBe(PixDepositState.RECEIVED);
      expect(warningPixDeposit.state).toBe(WarningPixDepositState.REJECTED);
    });
  });
});
