import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  PixDepositRepository,
  PixDepositEntity,
  PixDepositState,
  WarningPixDepositRepository,
  PixDepositCacheRepository,
} from '@zro/pix-payments/domain';
import {
  HandleWaitingPixDepositEventUseCase as UseCase,
  PixDepositEventEmitter,
  PixDepositNotFoundException,
  OperationService,
  ComplianceService,
  WarningPixDepositEventEmitter,
  WarningDepositChecker,
} from '@zro/pix-payments/application';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

describe('WaitingPixDepositEventUseCase', () => {
  const makeSut = () => {
    const pixDepositRepository: PixDepositRepository =
      createMock<PixDepositRepository>();
    const mockGetPixDepositByIdRepository: jest.Mock = On(
      pixDepositRepository,
    ).get(method((mock) => mock.getById));
    const mockCreatePixDepositRepository: jest.Mock = On(
      pixDepositRepository,
    ).get(method((mock) => mock.create));

    const warningPixDepositRepository: WarningPixDepositRepository =
      createMock<WarningPixDepositRepository>();
    const mockCreatedWarningPixDeposit: jest.Mock = On(
      warningPixDepositRepository,
    ).get(method((mock) => mock.create));

    const operationService: OperationService = createMock<OperationService>();
    const mockCreateAndAcceptOperation: jest.Mock = On(operationService).get(
      method((mock) => mock.createAndAcceptOperation),
    );
    const mockCreateOperation: jest.Mock = On(operationService).get(
      method((mock) => mock.createOperation),
    );

    const complianceService: ComplianceService =
      createMock<ComplianceService>();
    const mockCreateWarningTransaction: jest.Mock = On(complianceService).get(
      method((mock) => mock.createWarningTransaction),
    );

    const warningPixDepositEventEmitter: WarningPixDepositEventEmitter =
      createMock<WarningPixDepositEventEmitter>();
    const mockCreatedWarningPixDepositEvent: jest.Mock = On(
      warningPixDepositEventEmitter,
    ).get(method((mock) => mock.createdWarningPixDeposit));

    const pixDepositEventEmitter: PixDepositEventEmitter =
      createMock<PixDepositEventEmitter>();
    const mockEmitReceivedEvent: jest.Mock = On(pixDepositEventEmitter).get(
      method((mock) => mock.receivedDeposit),
    );

    const pixDepositCacheRepository: PixDepositCacheRepository =
      createMock<PixDepositCacheRepository>();
    const mockGetPixDepositByIdCacheRepository: jest.Mock = On(
      pixDepositCacheRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdatePixDepositByIdCacheRepository: jest.Mock = On(
      pixDepositCacheRepository,
    ).get(method((mock) => mock.update));

    const operationCurrencyTag = 'REAL';
    const operationReceivedPixDepositTransactionTag = 'PIXREC';

    const sut = new UseCase(
      logger,
      pixDepositRepository,
      warningPixDepositRepository,
      operationService,
      complianceService,
      warningPixDepositEventEmitter,
      pixDepositEventEmitter,
      pixDepositCacheRepository,
      operationCurrencyTag,
      operationReceivedPixDepositTransactionTag,
    );

    return {
      sut,
      mockGetPixDepositByIdRepository,
      mockGetPixDepositByIdCacheRepository,
      mockEmitReceivedEvent,
      mockUpdatePixDepositByIdCacheRepository,
      mockCreatePixDepositRepository,
      mockCreateAndAcceptOperation,
      mockCreateOperation,
      mockCreatedWarningPixDeposit,
      mockCreatedWarningPixDepositEvent,
      mockCreateWarningTransaction,
    };
  };

  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if there are missing data', async () => {
      const { sut, mockEmitReceivedEvent } = makeSut();

      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockEmitReceivedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw PixDepositNotFoundException if PixDeposit is not found', async () => {
      const {
        sut,
        mockGetPixDepositByIdCacheRepository,
        mockEmitReceivedEvent,
      } = makeSut();

      mockGetPixDepositByIdCacheRepository.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(faker.datatype.uuid());

      await expect(testScript).rejects.toThrow(PixDepositNotFoundException);

      expect(mockGetPixDepositByIdCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitReceivedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should return deposit if state is already received', async () => {
      const {
        sut,
        mockGetPixDepositByIdCacheRepository,
        mockEmitReceivedEvent,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { state: PixDepositState.RECEIVED },
      );

      mockGetPixDepositByIdCacheRepository.mockResolvedValueOnce(deposit);

      const result = await sut.execute(deposit.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject(deposit);
      expect(mockGetPixDepositByIdCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitReceivedEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should receive deposit that has no check and create and accept operation successfully.', async () => {
      const {
        sut,
        mockGetPixDepositByIdCacheRepository,
        mockEmitReceivedEvent,
        mockUpdatePixDepositByIdCacheRepository,
        mockGetPixDepositByIdRepository,
        mockCreatePixDepositRepository,
        mockCreateAndAcceptOperation,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { state: PixDepositState.WAITING },
      );

      mockGetPixDepositByIdCacheRepository.mockResolvedValueOnce(deposit);
      mockGetPixDepositByIdRepository.mockResolvedValueOnce(null);
      mockCreatePixDepositRepository.mockImplementation((i) => i);

      const result = await sut.execute(deposit.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        ...deposit,
        state: PixDepositState.RECEIVED,
      });
      expect(mockGetPixDepositByIdCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositByIdCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitReceivedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetPixDepositByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should receive deposit that has only true value checks and create and accept operation successfully.', async () => {
      const {
        sut,
        mockGetPixDepositByIdCacheRepository,
        mockEmitReceivedEvent,
        mockUpdatePixDepositByIdCacheRepository,
        mockGetPixDepositByIdRepository,
        mockCreatePixDepositRepository,
        mockCreateAndAcceptOperation,
      } = makeSut();

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        {
          state: PixDepositState.WAITING,
          check: {
            isCEF: true,
            isSantanted: true,
            isDuplicated: true,
            isOverWarningIncome: true,
          },
        },
      );

      mockGetPixDepositByIdCacheRepository.mockResolvedValueOnce(deposit);
      mockGetPixDepositByIdRepository.mockResolvedValueOnce(null);
      mockCreatePixDepositRepository.mockImplementation((i) => i);

      const result = await sut.execute(deposit.id);

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        ...deposit,
        state: PixDepositState.RECEIVED,
      });
      expect(mockGetPixDepositByIdCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdatePixDepositByIdCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitReceivedEvent).toHaveBeenCalledTimes(1);
      expect(mockGetPixDepositByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreatePixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should receive deposit that has false value check, create operation and send to compliance successfully.', async () => {
      const {
        sut,
        mockGetPixDepositByIdCacheRepository,
        mockEmitReceivedEvent,
        mockUpdatePixDepositByIdCacheRepository,
        mockCreatePixDepositRepository,
        mockCreateAndAcceptOperation,
        mockCreateOperation,
        mockCreatedWarningPixDeposit,
        mockCreatedWarningPixDepositEvent,
        mockCreateWarningTransaction,
        mockGetPixDepositByIdRepository,
      } = makeSut();

      let i = WarningDepositChecker.checkers;
      const result = [true, false];
      const check = {};

      while (i > 0) {
        const checkName = faker.lorem.words(1);
        check[checkName] = result[Math.round(Math.random())];

        i--;
      }

      const deposit = await PixDepositFactory.create<PixDepositEntity>(
        PixDepositEntity.name,
        { state: PixDepositState.WAITING, check },
      );

      mockGetPixDepositByIdCacheRepository.mockResolvedValueOnce(deposit);
      mockGetPixDepositByIdRepository.mockResolvedValueOnce(null);
      mockCreatePixDepositRepository.mockImplementation((i) => i);

      const testScript = await sut.execute(deposit.id);

      expect(testScript).toBeDefined();
      expect(testScript).toMatchObject(deposit);
      expect(testScript.state).toBe(PixDepositState.WAITING);
      expect(mockGetPixDepositByIdCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockEmitReceivedEvent).toHaveBeenCalledTimes(0);
      expect(mockUpdatePixDepositByIdCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockCreatePixDepositRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateOperation).toHaveBeenCalledTimes(1);
      expect(mockCreatedWarningPixDeposit).toHaveBeenCalledTimes(1);
      expect(mockCreatedWarningPixDepositEvent).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(1);
      expect(mockGetPixDepositByIdRepository).toHaveBeenCalledTimes(1);
    });
  });
});
