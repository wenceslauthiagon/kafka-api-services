import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
} from '@zro/pix-payments/domain';
import {
  HandleAcknowledgePixInfractionEventUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('AcknowledgeInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockAcknowledgePendingInfractionEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.acknowledgedPendingInfraction));

    return {
      eventEmitter,
      mockAcknowledgePendingInfractionEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));

    const mockGetInfractionByPspIdRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getByInfractionPspId));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByPspIdRepository,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockGetInfractionByPspIdRepository,
      mockUpdateInfractionRepository,
    } = mockRepository();
    const { eventEmitter, mockAcknowledgePendingInfractionEvent } =
      mockEmitter();

    const sut = new UseCase(logger, infractionRepository, eventEmitter);
    return {
      sut,
      infractionRepository,
      mockGetInfractionByPspIdRepository,
      mockUpdateInfractionRepository,
      mockAcknowledgePendingInfractionEvent,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockUpdateInfractionRepository,
        mockAcknowledgePendingInfractionEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockAcknowledgePendingInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to acknowledged if infraction not exists', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockUpdateInfractionRepository,
        mockAcknowledgePendingInfractionEvent,
      } = makeSut();
      const { infractionPspId } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );
      mockGetInfractionByPspIdRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(infractionPspId);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockAcknowledgePendingInfractionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - should update infraction successfully', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockUpdateInfractionRepository,
        mockAcknowledgePendingInfractionEvent,
      } = makeSut();
      const { infractionPspId } =
        await InfractionFactory.create<PixInfractionEntity>(
          PixInfractionEntity.name,
        );

      const result = await sut.execute(infractionPspId);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.ACKNOWLEDGED);
      expect(result.state).toEqual(PixInfractionState.ACKNOWLEDGED_PENDING);
      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockAcknowledgePendingInfractionEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - should return infraction if it already exists ACKNOWLEDGED_PENDING', async () => {
      const {
        sut,
        mockGetInfractionByPspIdRepository,
        mockUpdateInfractionRepository,
        mockAcknowledgePendingInfractionEvent,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.ACKNOWLEDGED_PENDING },
      );

      mockGetInfractionByPspIdRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.infractionPspId);

      expect(result).toBeDefined();
      expect(result.state).toEqual(PixInfractionState.ACKNOWLEDGED_PENDING);
      expect(mockGetInfractionByPspIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockAcknowledgePendingInfractionEvent).toHaveBeenCalledTimes(0);
    });
  });
});
