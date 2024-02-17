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
  HandleCancelPendingPixInfractionReceivedEventUseCase as UseCase,
  PixInfractionEventEmitter,
  PixInfractionNotFoundException,
  IssueInfractionGateway,
  PixInfractionInvalidStateException,
} from '@zro/pix-payments/application';
import { InfractionFactory } from '@zro/test/pix-payments/config';

describe('HandleCancelPendingPixInfractionReceivedEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: PixInfractionEventEmitter =
      createMock<PixInfractionEventEmitter>();

    const mockCancelConfirmedInfractionEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.cancelConfirmedInfractionReceived),
    );

    return {
      eventEmitter,
      mockCancelConfirmedInfractionEvent,
    };
  };

  const mockRepository = () => {
    const infractionRepository: PixInfractionRepository =
      createMock<PixInfractionRepository>();
    const mockUpdateInfractionRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.update));

    const mockGetInfractionByIdRepository: jest.Mock = On(
      infractionRepository,
    ).get(method((mock) => mock.getById));

    return {
      infractionRepository,
      mockUpdateInfractionRepository,
      mockGetInfractionByIdRepository,
    };
  };

  const mockGateway = () => {
    const issuePixInfractionGateway: IssueInfractionGateway =
      createMock<IssueInfractionGateway>();
    const mockUpdatePixInfractionIssueGateway: jest.Mock = On(
      issuePixInfractionGateway,
    ).get(method((mock) => mock.updateInfractionStatus));

    return {
      issuePixInfractionGateway,
      mockUpdatePixInfractionIssueGateway,
    };
  };

  const makeSut = () => {
    const {
      infractionRepository,
      mockGetInfractionByIdRepository,
      mockUpdateInfractionRepository,
    } = mockRepository();
    const { eventEmitter, mockCancelConfirmedInfractionEvent } = mockEmitter();

    const { issuePixInfractionGateway, mockUpdatePixInfractionIssueGateway } =
      mockGateway();

    const sut = new UseCase(
      logger,
      infractionRepository,
      issuePixInfractionGateway,
      eventEmitter,
    );
    return {
      sut,
      infractionRepository,
      mockGetInfractionByIdRepository,
      mockUpdateInfractionRepository,
      mockCancelConfirmedInfractionEvent,
      mockUpdatePixInfractionIssueGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update if missing params', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdatePixInfractionIssueGateway,
        mockCancelConfirmedInfractionEvent,
      } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionIssueGateway).toHaveBeenCalledTimes(0);
      expect(mockCancelConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not alter status to canceled if infraction not exists', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdatePixInfractionIssueGateway,
        mockCancelConfirmedInfractionEvent,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
      );
      mockGetInfractionByIdRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(infraction.id);

      await expect(testScript).rejects.toThrow(PixInfractionNotFoundException);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionIssueGateway).toHaveBeenCalledTimes(0);
      expect(mockCancelConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not alter status to canceled if state is invalid', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdatePixInfractionIssueGateway,
        mockCancelConfirmedInfractionEvent,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        { state: PixInfractionState.OPEN_CONFIRMED },
      );
      mockGetInfractionByIdRepository.mockResolvedValue(infraction);

      const testScript = () => sut.execute(infraction.id);

      await expect(testScript).rejects.toThrow(
        PixInfractionInvalidStateException,
      );
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixInfractionIssueGateway).toHaveBeenCalledTimes(0);
      expect(mockCancelConfirmedInfractionEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should cancel pending infraction successfully', async () => {
      const {
        sut,
        mockGetInfractionByIdRepository,
        mockUpdateInfractionRepository,
        mockUpdatePixInfractionIssueGateway,
        mockCancelConfirmedInfractionEvent,
      } = makeSut();
      const infraction = await InfractionFactory.create<PixInfractionEntity>(
        PixInfractionEntity.name,
        {
          state: PixInfractionState.CANCEL_PENDING,
          status: PixInfractionStatus.CANCELLED,
        },
      );
      mockGetInfractionByIdRepository.mockResolvedValue(infraction);

      const result = await sut.execute(infraction.id);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PixInfractionStatus.CANCELLED);
      expect(result.state).toEqual(PixInfractionState.CANCEL_CONFIRMED);
      expect(mockGetInfractionByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateInfractionRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixInfractionIssueGateway).toHaveBeenCalledTimes(1);
      expect(mockCancelConfirmedInfractionEvent).toHaveBeenCalledTimes(1);
    });
  });
});
