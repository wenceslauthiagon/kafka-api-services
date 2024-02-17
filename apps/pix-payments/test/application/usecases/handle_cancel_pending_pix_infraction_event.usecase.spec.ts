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
  HandleCancelPendingPixInfractionEventUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
  PixInfractionGateway,
  PixInfractionInvalidStateException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('HandleCancelPendingInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockGateway = () => {
    const pspGateway: PixInfractionGateway = createMock<PixInfractionGateway>();

    const mockCancelInfractionGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.cancelInfraction),
    );

    return {
      pspGateway,
      mockCancelInfractionGateway,
    };
  };

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockConfirmedCancelInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelConfirmedInfraction),
    );

    return {
      eventEmitter,
      mockConfirmedCancelInfractionEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();

    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));

    const mockGetByIdInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getById));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIdInfractionRepository,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIdInfractionRepository,
    } = mockRepository();

    const { eventEmitter, mockConfirmedCancelInfractionEvent } = mockEmitter();

    const { pspGateway, mockCancelInfractionGateway } = mockGateway();

    const sut = new UseCase(
      logger,
      infractionRepository,
      pspGateway,
      eventEmitter,
    );
    return {
      sut,
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIdInfractionRepository,
      mockConfirmedCancelInfractionEvent,
      pspGateway,
      mockCancelInfractionGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockCancelInfractionGateway,
        mockConfirmedCancelInfractionEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCancelInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCancelInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not cancel if infraction not exists', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockCancelInfractionGateway,
        mockConfirmedCancelInfractionEvent,
      } = makeSut();
      const { id } = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );
      mockGetByIdInfractionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCancelInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCancelInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not cancel if infraction not exists', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockCancelInfractionGateway,
        mockConfirmedCancelInfractionEvent,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.OPEN_CONFIRMED },
      );
      mockGetByIdInfractionRepository.mockResolvedValue(infraction);

      const testScript = () => sut.execute(infraction.id);

      await expect(testScript).rejects.toThrow(
        PixInfractionInvalidStateException,
      );
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockCancelInfractionGateway).toHaveBeenCalledTimes(0);
      expect(mockConfirmedCancelInfractionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - should update infraction successfully', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockCancelInfractionGateway,
        mockConfirmedCancelInfractionEvent,
      } = makeSut();

      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CANCEL_PENDING,
          status: PixInfractionStatus.CANCELLED,
        },
      );

      mockGetByIdInfractionRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.CANCELLED);
      expect(result.state).toEqual(PixInfractionState.CANCEL_CONFIRMED);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockCancelInfractionGateway).toHaveBeenCalledTimes(1);
      expect(mockConfirmedCancelInfractionEvent).toHaveBeenCalledTimes(1);
    });
  });
});
