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
  HandleAcknowledgePendingPixInfractionEventUseCase as UseCase,
  PixInfractionEventEmitter,
  IssueInfractionGateway,
  PixInfractionNotFoundException,
  PixInfractionInvalidStateException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('HandleAcknowledgePendingInfractionEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockAcknowledgeConfirmedInfractionEvent: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.acknowledgedConfirmedInfraction));

    return {
      eventEmitter,
      mockAcknowledgeConfirmedInfractionEvent,
    };
  };

  const mockGateway = () => {
    const infractionGateway: IssueInfractionGateway =
      createMock<IssueInfractionGateway>();
    const mockUpdateStatusInfractionGateway: jest.Mock = On(
      infractionGateway,
    ).get(method((mock) => mock.updateInfractionStatus));

    return {
      infractionGateway,
      mockUpdateStatusInfractionGateway,
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

    const { eventEmitter, mockAcknowledgeConfirmedInfractionEvent } =
      mockEmitter();

    const { infractionGateway, mockUpdateStatusInfractionGateway } =
      mockGateway();

    const sut = new UseCase(
      logger,
      infractionRepository,
      infractionGateway,
      eventEmitter,
    );
    return {
      sut,
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetByIdInfractionRepository,
      mockAcknowledgeConfirmedInfractionEvent,
      mockUpdateStatusInfractionGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockAcknowledgeConfirmedInfractionEvent,
        mockUpdateStatusInfractionGateway,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockAcknowledgeConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateStatusInfractionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if infraction not exists', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockAcknowledgeConfirmedInfractionEvent,
        mockUpdateStatusInfractionGateway,
      } = makeSut();
      const { id } = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );
      mockGetByIdInfractionRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(id);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockAcknowledgeConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateStatusInfractionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if infraction state is invalid', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockAcknowledgeConfirmedInfractionEvent,
        mockUpdateStatusInfractionGateway,
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
      expect(mockAcknowledgeConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdateStatusInfractionGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - should create infraction successfully', async () => {
      const {
        sut,
        mockGetByIdInfractionRepository,
        mockUpdateInfractionRepository,
        mockAcknowledgeConfirmedInfractionEvent,
        mockUpdateStatusInfractionGateway,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.ACKNOWLEDGED_PENDING },
      );
      mockGetByIdInfractionRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.ACKNOWLEDGED);
      expect(result.state).toEqual(PixInfractionState.ACKNOWLEDGED_CONFIRMED);
      expect(mockGetByIdInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockAcknowledgeConfirmedInfractionEvent).toHaveBeenCalledTimes(1);
      expect(mockUpdateStatusInfractionGateway).toHaveBeenCalledTimes(1);
    });
  });
});
