import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositEntity,
  PixDepositRepository,
  WarningPixDepositEntity,
  WarningPixDepositRepository,
  PixDevolutionCode,
  WarningPixDevolutionEntity,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import {
  HandleCreateWarningPixDevolutionEventUseCase as UseCase,
  WarningPixDevolutionEventEmitter,
  WarningPixDepositNotFoundException,
  PixDepositNotFoundException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  WarningPixDepositFactory,
  WarningPixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('HandleCreateWarningPixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const warningPixDevolutionRepository: WarningPixDevolutionRepository =
      createMock<WarningPixDevolutionRepository>();

    const mockGetByIdDevolutionRepository: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.getById));

    const mockCreateDevolutionRepository: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.create));

    const warningPixDepositRepository: WarningPixDepositRepository =
      createMock<WarningPixDepositRepository>();

    const mockGetByIdWarningPixDepositRepository: jest.Mock = On(
      warningPixDepositRepository,
    ).get(method((mock) => mock.getById));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();

    const mockGetByOperationPixDepositRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getByOperation));

    const mockUpdatePixDepositRepository: jest.Mock = On(depositRepository).get(
      method((mock) => mock.update),
    );

    const eventWarningPixDevolutionEmitter: WarningPixDevolutionEventEmitter =
      createMock<WarningPixDevolutionEventEmitter>();

    const mockEmitEvent: jest.Mock = On(eventWarningPixDevolutionEmitter).get(
      method((mock) => mock.pendingWarningPixDevolution),
    );

    const sut = new UseCase(
      logger,
      warningPixDevolutionRepository,
      warningPixDepositRepository,
      eventWarningPixDevolutionEmitter,
      depositRepository,
    );

    return {
      sut,
      mockGetByIdDevolutionRepository,
      mockCreateDevolutionRepository,
      mockGetByIdWarningPixDepositRepository,
      mockGetByOperationPixDepositRepository,
      mockUpdatePixDepositRepository,
      mockEmitEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockCreateDevolutionRepository,
        mockGetByIdWarningPixDepositRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdatePixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const testScripts = [
        () => sut.execute('test', null),
        () => sut.execute(null, 'test'),
      ];

      testScripts.forEach((testScript) =>
        expect(testScript).rejects.toThrow(MissingDataException),
      );

      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdWarningPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should return existent devolution', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockCreateDevolutionRepository,
        mockGetByIdWarningPixDepositRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdatePixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const id = 'test';
      const warningPixDepositId = 'test';

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          { id },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(warningPixDevolution);

      const result = await sut.execute(id, warningPixDepositId);

      expect(result).toBeDefined();
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdWarningPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw WarningPixDepositNotFoundException when warning pix deposit is not found', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockCreateDevolutionRepository,
        mockGetByIdWarningPixDepositRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdatePixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const id = 'test';
      const warningPixDepositId = 'test';

      mockGetByIdDevolutionRepository.mockResolvedValue(undefined);
      mockGetByIdWarningPixDepositRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(id, warningPixDepositId);
      await expect(testScript).rejects.toThrow(
        WarningPixDepositNotFoundException,
      );

      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdWarningPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw PixDepositNotFoundException when pix deposit is not found', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockCreateDevolutionRepository,
        mockGetByIdWarningPixDepositRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdatePixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const id = 'test';
      const warningPixDepositId = 'test';

      mockGetByIdDevolutionRepository.mockResolvedValue(undefined);

      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          { id: warningPixDepositId },
        );

      mockGetByIdWarningPixDepositRepository.mockResolvedValue(
        warningPixDeposit,
      );

      mockGetByOperationPixDepositRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(id, warningPixDepositId);
      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);

      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdWarningPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should create warning pix devolution if compliance request', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockCreateDevolutionRepository,
        mockGetByIdWarningPixDepositRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdatePixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const id = 'test';
      const warningPixDepositId = 'test';

      mockGetByIdDevolutionRepository.mockResolvedValue(undefined);

      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          { id: warningPixDepositId, state: WarningPixDepositState.APPROVED },
        );

      mockGetByIdWarningPixDepositRepository.mockResolvedValue(
        warningPixDeposit,
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { operation: warningPixDeposit.operation },
      );

      mockGetByOperationPixDepositRepository.mockResolvedValue(deposit);

      const result = await sut.execute(id, warningPixDepositId);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user).toBe(deposit.user);
      expect(result.operation).toBe(deposit.operation);
      expect(result.endToEndId).toBe(deposit.endToEndId);
      expect(result.amount).toBe(deposit.amount);
      expect(result.devolutionCode).toBe(PixDevolutionCode.FRAUD);
      expect(result.description).toBe(deposit.description);
      expect(result.state).toBe(WarningPixDevolutionState.PENDING);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdWarningPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should create warning pix devolution if user request', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockCreateDevolutionRepository,
        mockGetByIdWarningPixDepositRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdatePixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const id = 'test';
      const warningPixDepositId = 'test';

      mockGetByIdDevolutionRepository.mockResolvedValue(undefined);

      const warningPixDeposit =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          { id: warningPixDepositId, state: WarningPixDepositState.CREATED },
        );

      mockGetByIdWarningPixDepositRepository.mockResolvedValue(
        warningPixDeposit,
      );

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { operation: warningPixDeposit.operation },
      );

      mockGetByOperationPixDepositRepository.mockResolvedValue(deposit);

      const result = await sut.execute(id, warningPixDepositId);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user).toBe(deposit.user);
      expect(result.operation).toBe(deposit.operation);
      expect(result.endToEndId).toBe(deposit.endToEndId);
      expect(result.amount).toBe(deposit.amount);
      expect(result.devolutionCode).toBe(PixDevolutionCode.ORIGINAL);
      expect(result.description).toBe(deposit.description);
      expect(result.state).toBe(WarningPixDevolutionState.PENDING);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdWarningPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
    });
  });
});
