import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDevolutionState,
  WarningPixDevolutionEntity,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  HandleCompleteWarningPixDevolutionEventUseCase as UseCase,
  WarningPixDevolutionEventEmitter,
  WarningPixDevolutionInvalidStateException,
  WarningPixDevolutionNotFoundException,
} from '@zro/pix-payments/application';
import { WarningPixDevolutionFactory } from '@zro/test/pix-payments/config';

describe('HandleCompleteWarningPixDevolutionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const warningPixDevolutionRepository: WarningPixDevolutionRepository =
      createMock<WarningPixDevolutionRepository>();
    const mockUpdateWarningPixDevolutionRepository: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.update));
    const mockGetByIdWarningPixDevolutionRepository: jest.Mock = On(
      warningPixDevolutionRepository,
    ).get(method((mock) => mock.getById));

    return {
      warningPixDevolutionRepository,
      mockUpdateWarningPixDevolutionRepository,
      mockGetByIdWarningPixDevolutionRepository,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: WarningPixDevolutionEventEmitter =
      createMock<WarningPixDevolutionEventEmitter>();
    const mockConfirmedEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.confirmedWarningPixDevolution),
    );

    return {
      eventEmitter,
      mockConfirmedEventEmitter,
    };
  };

  const makeSut = () => {
    const {
      warningPixDevolutionRepository,
      mockUpdateWarningPixDevolutionRepository,
      mockGetByIdWarningPixDevolutionRepository,
    } = mockRepository();

    const { eventEmitter, mockConfirmedEventEmitter } = mockEmitter();

    const sut = new UseCase(
      logger,
      warningPixDevolutionRepository,
      eventEmitter,
    );

    return {
      sut,
      mockUpdateWarningPixDevolutionRepository,
      mockGetByIdWarningPixDevolutionRepository,
      mockConfirmedEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const {
        sut,
        mockUpdateWarningPixDevolutionRepository,
        mockGetByIdWarningPixDevolutionRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockUpdateWarningPixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdWarningPixDevolutionRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw WarningPixDevolutionNotFoundException when devolution is not found', async () => {
      const {
        sut,
        mockUpdateWarningPixDevolutionRepository,
        mockGetByIdWarningPixDevolutionRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      mockGetByIdWarningPixDevolutionRepository.mockResolvedValue(undefined);

      const testScript = () => sut.execute(faker.datatype.uuid());

      await expect(testScript).rejects.toThrow(
        WarningPixDevolutionNotFoundException,
      );
      expect(mockUpdateWarningPixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdWarningPixDevolutionRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return when warning pix devolution state is already confirmed', async () => {
      const {
        sut,
        mockUpdateWarningPixDevolutionRepository,
        mockGetByIdWarningPixDevolutionRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.CONFIRMED,
          },
        );

      mockGetByIdWarningPixDevolutionRepository.mockResolvedValue(
        warningPixDevolution,
      );

      const result = await sut.execute(warningPixDevolution.id);

      expect(result).toBeDefined();
      expect(result.state).toBe(PixDevolutionState.CONFIRMED);
      expect(mockUpdateWarningPixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdWarningPixDevolutionRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw WarningPixDevolutionInvalidStateException when state is not waiting', async () => {
      const {
        sut,
        mockUpdateWarningPixDevolutionRepository,
        mockGetByIdWarningPixDevolutionRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          {
            state: WarningPixDevolutionState.ERROR,
          },
        );

      mockGetByIdWarningPixDevolutionRepository.mockResolvedValue(
        warningPixDevolution,
      );

      const testScript = () => sut.execute(warningPixDevolution.id);

      await expect(testScript).rejects.toThrow(
        WarningPixDevolutionInvalidStateException,
      );
      expect(mockUpdateWarningPixDevolutionRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdWarningPixDevolutionRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should handle complete warning pix devolution', async () => {
      const {
        sut,
        mockUpdateWarningPixDevolutionRepository,
        mockGetByIdWarningPixDevolutionRepository,
        mockConfirmedEventEmitter,
      } = makeSut();

      const warningPixDevolution =
        await WarningPixDevolutionFactory.create<WarningPixDevolutionEntity>(
          WarningPixDevolutionEntity.name,
          { state: WarningPixDevolutionState.WAITING },
        );

      mockGetByIdWarningPixDevolutionRepository.mockResolvedValue(
        warningPixDevolution,
      );

      const endToEndId = faker.datatype.uuid();

      const result = await sut.execute(warningPixDevolution.id, endToEndId);

      expect(result.state).toBe(WarningPixDevolutionState.CONFIRMED);
      expect(result.endToEndId).toBe(endToEndId);
      expect(mockUpdateWarningPixDevolutionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdWarningPixDevolutionRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockConfirmedEventEmitter).toHaveBeenCalledTimes(1);
    });
  });
});
