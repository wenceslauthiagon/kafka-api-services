import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  PixDepositEntity,
  WarningPixDevolutionRepository,
  WarningPixDevolutionEntity,
  WarningPixDevolutionState,
  PixDevolutionCode,
} from '@zro/pix-payments/domain';
import { OperationEntity, OperationState } from '@zro/operations/domain';
import { OperationNotFoundException } from '@zro/operations/application';
import {
  HandlePendingWarningPixDevolutionEventUseCase as UseCase,
  PixPaymentGateway,
  IssueWarningTransactionGateway,
  WarningPixDevolutionEventEmitter,
  WarningPixDevolutionNotFoundException,
  WarningPixDevolutionInvalidStateException,
  PixDepositNotFoundException,
  OperationService,
  ComplianceService,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  WarningPixDevolutionFactory,
} from '@zro/test/pix-payments/config';

const APP_JIRA_MESSAGE_USER_REQUEST_WARNING_PIX_DEVOLUTION =
  'Estorno realizado pelo próprio usuário pelo aplicativo.';

describe('HandlePendingWarningPixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: WarningPixDevolutionEventEmitter =
      createMock<WarningPixDevolutionEventEmitter>();

    const mockWaitingWarningPixDevolution: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.waitingWarningPixDevolution),
    );

    return {
      eventEmitter,
      mockWaitingWarningPixDevolution,
    };
  };

  const mockRepository = () => {
    const warningPixDevolutionRepository: WarningPixDevolutionRepository =
      createMock<WarningPixDevolutionRepository>();

    const mockWarningPixDevolutionRepositoryGetById: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.getById));

    const mockWarningPixDevolutionRepositoryUpdate: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.update));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();

    const mockDepositRepositoryGetByOperation: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getByOperation));

    return {
      warningPixDevolutionRepository,
      mockWarningPixDevolutionRepositoryGetById,
      mockWarningPixDevolutionRepositoryUpdate,
      depositRepository,
      mockDepositRepositoryGetByOperation,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();

    const mockGetOperationById: jest.Mock = On(operationService).get(
      method((mock) => mock.getOperationById),
    );

    const mockRevertOperation: jest.Mock = On(operationService).get(
      method((mock) => mock.revertOperation),
    );

    const complianceService: ComplianceService =
      createMock<ComplianceService>();

    const mockGetWarningTransactionByOperation: jest.Mock = On(
      complianceService,
    ).get(method((mock) => mock.getWarningTransactionByOperation));

    return {
      operationService,
      mockGetOperationById,
      mockRevertOperation,
      complianceService,
      mockGetWarningTransactionByOperation,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixPaymentGateway = createMock<PixPaymentGateway>();
    const mockCreateWarningPixDevolutionGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.createWarningPixDevolution),
    );

    const issueWarningTransactionGateway: IssueWarningTransactionGateway =
      createMock<IssueWarningTransactionGateway>();
    const mockAddWarningTransactionCommentGateway: jest.Mock = On(
      issueWarningTransactionGateway,
    ).get(method((mock) => mock.addWarningTransactionComment));

    return {
      pspGateway,
      mockCreateWarningPixDevolutionGateway,
      issueWarningTransactionGateway,
      mockAddWarningTransactionCommentGateway,
    };
  };

  const makeSut = () => {
    const {
      warningPixDevolutionRepository,
      mockWarningPixDevolutionRepositoryGetById,
      mockWarningPixDevolutionRepositoryUpdate,
      depositRepository,
      mockDepositRepositoryGetByOperation,
    } = mockRepository();

    const {
      pspGateway,
      mockCreateWarningPixDevolutionGateway,
      issueWarningTransactionGateway,
      mockAddWarningTransactionCommentGateway,
    } = mockGateway();

    const { eventEmitter, mockWaitingWarningPixDevolution } = mockEmitter();

    const {
      operationService,
      mockGetOperationById,
      mockRevertOperation,
      complianceService,
      mockGetWarningTransactionByOperation,
    } = mockService();

    const sut = new UseCase(
      logger,
      warningPixDevolutionRepository,
      depositRepository,
      pspGateway,
      issueWarningTransactionGateway,
      operationService,
      complianceService,
      eventEmitter,
      APP_JIRA_MESSAGE_USER_REQUEST_WARNING_PIX_DEVOLUTION,
    );

    return {
      sut,
      mockWarningPixDevolutionRepositoryGetById,
      mockWarningPixDevolutionRepositoryUpdate,
      mockDepositRepositoryGetByOperation,
      mockCreateWarningPixDevolutionGateway,
      mockAddWarningTransactionCommentGateway,
      mockWaitingWarningPixDevolution,
      mockGetOperationById,
      mockRevertOperation,
      mockGetWarningTransactionByOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        0,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(0);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(0);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockRevertOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw WarningPixDevolutionNotFoundException when WarningPixDevolution not found ', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      mockWarningPixDevolutionRepositoryGetById.mockResolvedValue(undefined);

      const testScript = () => sut.execute(faker.datatype.uuid());

      await expect(testScript).rejects.toThrow(
        WarningPixDevolutionNotFoundException,
      );
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(0);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(0);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockRevertOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return warningPixDevolution when WarningPixDevolutionState is WAITING or CONFIRMED', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.WAITING,
          },
        );

      mockWarningPixDevolutionRepositoryGetById.mockResolvedValue(
        warningPixDevolution,
      );

      const testScript = await sut.execute(warningPixDevolution.id);

      expect(testScript).toBeDefined();
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(0);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(0);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockRevertOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw WarningPixDevolutionInvalidStateException when WarningPixDevolutionState is not PENDING or FAILED', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.ERROR,
          },
        );

      mockWarningPixDevolutionRepositoryGetById.mockResolvedValue(
        warningPixDevolution,
      );

      const testScript = () => sut.execute(warningPixDevolution.id);

      await expect(testScript).rejects.toThrow(
        WarningPixDevolutionInvalidStateException,
      );
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(0);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(0);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(0);
      expect(mockRevertOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw OperationNotFoundException when operation is not found', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.PENDING,
          },
        );

      mockWarningPixDevolutionRepositoryGetById.mockResolvedValue(
        warningPixDevolution,
      );

      mockGetOperationById.mockResolvedValue(undefined);

      const testScript = () => sut.execute(warningPixDevolution.id);

      await expect(testScript).rejects.toThrow(OperationNotFoundException);
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(0);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(0);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockRevertOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw PixDepositNotFoundException when deposit is not found', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.PENDING,
          },
        );

      mockWarningPixDevolutionRepositoryGetById.mockResolvedValue(
        warningPixDevolution,
      );

      const operation = new OperationEntity({
        id: faker.datatype.uuid(),
        state: OperationState.PENDING,
      });

      mockGetOperationById.mockResolvedValue(operation);

      mockDepositRepositoryGetByOperation.mockResolvedValue(undefined);

      const testScript = () => sut.execute(warningPixDevolution.id);

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(0);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(0);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(0);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockRevertOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should update warning pix devolution and revert operation', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      const operation = new OperationEntity({
        id: faker.datatype.uuid(),
        state: OperationState.PENDING,
      });

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.PENDING,
            operation,
          },
        );

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          operation,
        },
      );

      mockWarningPixDevolutionRepositoryGetById.mockResolvedValue(
        warningPixDevolution,
      );

      mockGetOperationById.mockResolvedValue(operation);

      mockDepositRepositoryGetByOperation.mockResolvedValue(pixDeposit);

      const result = await sut.execute(warningPixDevolution.id);

      expect(result).toBeDefined();
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(1);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(1);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockRevertOperation).toHaveBeenCalledTimes(1);
      expect(result.state).toBe(WarningPixDevolutionState.WAITING);
    });

    it('TC0008 - Should update warning pix devolution and do not revert operation', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      const operation = new OperationEntity({
        id: faker.datatype.uuid(),
        state: OperationState.REVERTED,
      });

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.FAILED,
            operation,
          },
        );

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          operation,
        },
      );

      mockWarningPixDevolutionRepositoryGetById.mockResolvedValue(
        warningPixDevolution,
      );

      mockGetOperationById.mockResolvedValue(operation);

      mockDepositRepositoryGetByOperation.mockResolvedValue(pixDeposit);

      const result = await sut.execute(warningPixDevolution.id);

      expect(result).toBeDefined();
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(1);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(1);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(0);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockRevertOperation).toHaveBeenCalledTimes(0);
      expect(result.state).toBe(WarningPixDevolutionState.WAITING);
    });

    it('TC0008 - Should update warning pix devolution if devolution code is ORIGINAL', async () => {
      const {
        sut,
        mockWarningPixDevolutionRepositoryGetById,
        mockWarningPixDevolutionRepositoryUpdate,
        mockDepositRepositoryGetByOperation,
        mockGetWarningTransactionByOperation,
        mockCreateWarningPixDevolutionGateway,
        mockAddWarningTransactionCommentGateway,
        mockWaitingWarningPixDevolution,
        mockGetOperationById,
        mockRevertOperation,
      } = makeSut();

      const operation = new OperationEntity({
        id: faker.datatype.uuid(),
        state: OperationState.REVERTED,
      });

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.PENDING,
            devolutionCode: PixDevolutionCode.ORIGINAL,
            operation,
          },
        );

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          operation,
        },
      );

      mockWarningPixDevolutionRepositoryGetById.mockResolvedValue(
        warningPixDevolution,
      );

      mockGetOperationById.mockResolvedValue(operation);

      mockDepositRepositoryGetByOperation.mockResolvedValue(pixDeposit);

      const result = await sut.execute(warningPixDevolution.id);

      expect(result).toBeDefined();
      expect(mockWarningPixDevolutionRepositoryGetById).toHaveBeenCalledTimes(
        1,
      );
      expect(mockWarningPixDevolutionRepositoryUpdate).toHaveBeenCalledTimes(1);
      expect(mockDepositRepositoryGetByOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningPixDevolutionGateway).toHaveBeenCalledTimes(1);
      expect(mockAddWarningTransactionCommentGateway).toHaveBeenCalledTimes(1);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(1);
      expect(mockWaitingWarningPixDevolution).toHaveBeenCalledTimes(1);
      expect(mockGetOperationById).toHaveBeenCalledTimes(1);
      expect(mockRevertOperation).toHaveBeenCalledTimes(0);
      expect(result.state).toBe(WarningPixDevolutionState.WAITING);
    });
  });
});
