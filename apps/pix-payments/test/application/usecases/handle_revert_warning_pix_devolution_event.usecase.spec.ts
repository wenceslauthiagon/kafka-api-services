import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { v4 as uuidV4 } from 'uuid';
import {
  FailedEntity,
  MissingDataException,
  defaultLogger as logger,
} from '@zro/common';
import { OperationEntity } from '@zro/operations/domain';
import {
  PixDepositEntity,
  PixDepositRepository,
  WarningPixDepositEntity,
  WarningPixDevolutionEntity,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandleRevertWarningPixDevolutionEventUseCase as UseCase,
  WarningPixDevolutionEventEmitter,
  PixDepositNotFoundException,
  WarningPixDevolutionNotFoundException,
  WarningPixDevolutionInvalidStateException,
} from '@zro/pix-payments/application';
import {
  PixDepositFactory,
  WarningPixDevolutionFactory,
} from '@zro/test/pix-payments/config';

describe('HandleRevertWarningPixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const warningPixDevolutionRepository: WarningPixDevolutionRepository =
      createMock<WarningPixDevolutionRepository>();

    const mockGetByIdDevolutionRepository: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.getById));

    const mockUpdateDevolutionRepository: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.update));

    const depositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();

    const mockGetByOperationPixDepositRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.getByOperation));

    const mockUpdateOperationPixDepositRepository: jest.Mock = On(
      depositRepository,
    ).get(method((mock) => mock.update));

    const eventWarningPixDevolutionEmitter: WarningPixDevolutionEventEmitter =
      createMock<WarningPixDevolutionEventEmitter>();

    const mockEmitEvent: jest.Mock = On(eventWarningPixDevolutionEmitter).get(
      method((mock) => mock.failedWarningPixDevolution),
    );

    const sut = new UseCase(
      logger,
      warningPixDevolutionRepository,
      depositRepository,
      eventWarningPixDevolutionEmitter,
    );

    return {
      sut,
      mockGetByIdDevolutionRepository,
      mockUpdateDevolutionRepository,
      mockGetByOperationPixDepositRepository,
      mockUpdateOperationPixDepositRepository,
      mockEmitEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockUpdateDevolutionRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdateOperationPixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw WarningPixDevolutionNotFoundException when warningPixDevolution not found', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockUpdateDevolutionRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdateOperationPixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const warningPixDevolutionFactory =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDepositEntity.name,
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(warningPixDevolutionFactory.id);

      await expect(testScript).rejects.toThrow(
        WarningPixDevolutionNotFoundException,
      );

      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw WarningPixDevolutionInvalidStateException when state is invalid', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockUpdateDevolutionRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdateOperationPixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.ERROR,
          },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(warningPixDevolution);
      const testScript = () => sut.execute(warningPixDevolution.id);

      await expect(testScript).rejects.toThrow(
        WarningPixDevolutionInvalidStateException,
      );

      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should return when state is already failed', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockUpdateDevolutionRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdateOperationPixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.FAILED,
          },
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(warningPixDevolution);

      const testScript = await sut.execute(warningPixDevolution.id);

      expect(testScript).toBeDefined();
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw PixDepositNotFoundException when deposit not found', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockUpdateDevolutionRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdateOperationPixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
        );

      mockGetByIdDevolutionRepository.mockResolvedValue(warningPixDevolution);

      mockGetByOperationPixDepositRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(warningPixDevolution.id);
      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);

      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateOperationPixDepositRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should update warning pix devolution', async () => {
      const {
        sut,
        mockGetByIdDevolutionRepository,
        mockUpdateDevolutionRepository,
        mockGetByOperationPixDepositRepository,
        mockUpdateOperationPixDepositRepository,
        mockEmitEvent,
      } = makeSut();

      const operation = new OperationEntity({
        id: uuidV4(),
      });

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            operation,
          },
        );

      const pixDeposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          operation,
        },
      );

      mockGetByIdDevolutionRepository.mockResolvedValue(warningPixDevolution);

      mockGetByOperationPixDepositRepository.mockResolvedValue(pixDeposit);

      const failed = new FailedEntity({
        code: 'test',
        message: 'test',
      });

      const chargebackReason = 'test';

      const result = await sut.execute(
        warningPixDevolution.id,
        chargebackReason,
        failed,
      );

      expect(result).toBeDefined();
      expect(result.state).toBe(WarningPixDevolutionState.FAILED);
      expect(result.failed).toBe(failed);
      expect(result.chargebackReason).toBe(chargebackReason);
      expect(mockGetByIdDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateOperationPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByOperationPixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
    });
  });
});
