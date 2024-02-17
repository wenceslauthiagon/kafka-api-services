import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  StreamPairEntity,
  StreamPairRepository,
  StreamQuotationGatewayEntity,
  StreamQuotationGatewayRepository,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import { CurrencyEntity, CurrencyState } from '@zro/operations/domain';
import {
  OperationService,
  CreateStreamQuotationUseCase as UseCase,
  StreamQuotationEventEmitter,
} from '@zro/quotations/application';
import {
  StreamPairFactory,
  StreamQuotationGatewayFactory,
} from '@zro/test/quotations/config';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('CreateStreamQuotationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const streamQuotationGatewayRepository: StreamQuotationGatewayRepository =
      createMock<StreamQuotationGatewayRepository>();
    const mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName: jest.Mock = On(
      streamQuotationGatewayRepository,
    ).get(
      method((mock) => mock.getByBaseCurrencyAndQuoteCurrencyAndGatewayName),
    );

    const streamQuotationRepository: StreamQuotationRepository =
      createMock<StreamQuotationRepository>();
    const mockCreateOrUpdateStreamQuotation: jest.Mock = On(
      streamQuotationRepository,
    ).get(method((mock) => mock.createOrUpdate));

    const streamPairRepository: StreamPairRepository =
      createMock<StreamPairRepository>();
    const mockGetAllActiveIsTrueStreamPair: jest.Mock = On(
      streamPairRepository,
    ).get(method((mock) => mock.getAllActiveIsTrue));

    return {
      streamQuotationGatewayRepository,
      mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      streamQuotationRepository,
      mockCreateOrUpdateStreamQuotation,
      streamPairRepository,
      mockGetAllActiveIsTrueStreamPair,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetAllActiveCurrencies: jest.Mock = On(operationService).get(
      method((mock) => mock.getAllActiveCurrencies),
    );

    return {
      operationService,
      mockGetAllActiveCurrencies,
    };
  };

  const makeSut = () => {
    const StreamQuotationEventEmitter: StreamQuotationEventEmitter =
      createMock<StreamQuotationEventEmitter>();

    const {
      streamQuotationGatewayRepository,
      mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      streamQuotationRepository,
      mockCreateOrUpdateStreamQuotation,
      streamPairRepository,
      mockGetAllActiveIsTrueStreamPair,
    } = mockRepository();

    const { operationService, mockGetAllActiveCurrencies } = mockService();

    const sut = new UseCase(
      logger,
      streamQuotationGatewayRepository,
      streamQuotationRepository,
      streamPairRepository,
      operationService,
      StreamQuotationEventEmitter,
    );

    return {
      sut,
      mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      mockCreateOrUpdateStreamQuotation,
      mockGetAllActiveIsTrueStreamPair,
      mockGetAllActiveCurrencies,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if enabled stream pairs not exists', async () => {
      const {
        sut,
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        mockCreateOrUpdateStreamQuotation,
        mockGetAllActiveIsTrueStreamPair,
        mockGetAllActiveCurrencies,
      } = makeSut();

      mockGetAllActiveIsTrueStreamPair.mockResolvedValue([]);

      const result = await sut.execute();

      expect(result).toEqual([]);
      expect(
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if no active currencies exists', async () => {
      const {
        sut,
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        mockCreateOrUpdateStreamQuotation,
        mockGetAllActiveIsTrueStreamPair,
        mockGetAllActiveCurrencies,
      } = makeSut();

      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
      );
      mockGetAllActiveIsTrueStreamPair.mockResolvedValue([
        streamPair,
        streamPair,
      ]);

      mockGetAllActiveCurrencies.mockResolvedValue([]);

      const result = await sut.execute();

      expect(result).toEqual([]);
      expect(
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not create if no currencies are also active', async () => {
      const {
        sut,
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        mockCreateOrUpdateStreamQuotation,
        mockGetAllActiveIsTrueStreamPair,
        mockGetAllActiveCurrencies,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { state: CurrencyState.DEACTIVATE },
      );
      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          baseCurrency: currency,
          quoteCurrency: currency,
        },
      );

      mockGetAllActiveIsTrueStreamPair.mockResolvedValue([
        streamPair,
        streamPair,
      ]);
      mockGetAllActiveCurrencies.mockResolvedValue([currency, currency]);

      const result = await sut.execute();

      expect(result).toEqual([]);
      expect(
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should not create if natural pairs not exists', async () => {
      const {
        sut,
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        mockCreateOrUpdateStreamQuotation,
        mockGetAllActiveIsTrueStreamPair,
        mockGetAllActiveCurrencies,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { state: CurrencyState.ACTIVE },
      );
      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          baseCurrency: currency,
          quoteCurrency: currency,
          composedBy: [
            new StreamPairEntity({ id: uuidV4() }),
            new StreamPairEntity({ id: uuidV4() }),
          ],
        },
      );

      mockGetAllActiveIsTrueStreamPair.mockResolvedValue([
        streamPair,
        streamPair,
      ]);
      mockGetAllActiveCurrencies.mockResolvedValue([currency, currency]);

      const result = await sut.execute();

      expect(result).toEqual([]);
      expect(
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      ).toHaveBeenCalledTimes(0);
      expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should not create if cant get stream quotation gateway and synthetic pairs', async () => {
      const {
        sut,
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        mockCreateOrUpdateStreamQuotation,
        mockGetAllActiveIsTrueStreamPair,
        mockGetAllActiveCurrencies,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { state: CurrencyState.ACTIVE },
      );
      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          baseCurrency: currency,
          quoteCurrency: currency,
          composedBy: null,
        },
      );

      mockGetAllActiveIsTrueStreamPair.mockResolvedValue([
        streamPair,
        streamPair,
      ]);
      mockGetAllActiveCurrencies.mockResolvedValue([currency, currency]);

      mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName.mockResolvedValue(
        null,
      );

      const result = await sut.execute();

      expect(result).toEqual([]);
      expect(
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      ).toHaveBeenCalledTimes(2);
      expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should not create if cant find spread and synthetic pairs', async () => {
      const {
        sut,
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        mockCreateOrUpdateStreamQuotation,
        mockGetAllActiveIsTrueStreamPair,
        mockGetAllActiveCurrencies,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { state: CurrencyState.ACTIVE },
      );
      const streamPair = await StreamPairFactory.create<StreamPairEntity>(
        StreamPairEntity.name,
        {
          baseCurrency: currency,
          quoteCurrency: currency,
          composedBy: null,
        },
      );

      const streamQuotationGateway =
        await StreamQuotationGatewayFactory.create<StreamQuotationGatewayEntity>(
          StreamQuotationGatewayEntity.name,
        );

      mockGetAllActiveIsTrueStreamPair.mockResolvedValue([
        streamPair,
        streamPair,
      ]);
      mockGetAllActiveCurrencies.mockResolvedValue([currency, currency]);

      mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName.mockResolvedValue(
        streamQuotationGateway,
      );

      const result = await sut.execute();

      expect(result).toEqual([]);
      expect(
        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
      ).toHaveBeenCalledTimes(2);
      expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
      expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
    });

    describe('With valid parameters', () => {
      it('TC0007 - Should create stream quotation - not enough pairs to build composed quotation', async () => {
        const {
          sut,
          mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
          mockCreateOrUpdateStreamQuotation,
          mockGetAllActiveIsTrueStreamPair,
          mockGetAllActiveCurrencies,
        } = makeSut();

        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { state: CurrencyState.ACTIVE },
        );

        const streamPair = await StreamPairFactory.create<StreamPairEntity>(
          StreamPairEntity.name,
          {
            baseCurrency: currency,
            quoteCurrency: currency,
            composedBy: null,
          },
        );

        const syntheticPair = await StreamPairFactory.create<StreamPairEntity>(
          StreamPairEntity.name,
          {
            baseCurrency: currency,
            quoteCurrency: currency,
            composedBy: [new StreamPairEntity({ id: uuidV4() })],
          },
        );

        const streamQuotationGateway =
          await StreamQuotationGatewayFactory.create<StreamQuotationGatewayEntity>(
            StreamQuotationGatewayEntity.name,
          );

        mockGetAllActiveIsTrueStreamPair.mockResolvedValue([
          streamPair,
          syntheticPair,
        ]);
        mockGetAllActiveCurrencies.mockResolvedValue([currency, currency]);

        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName.mockResolvedValue(
          streamQuotationGateway,
        );

        const result = await sut.execute();

        expect(result).toBeDefined();
        expect(result.length).toBe(1);

        const [firstQuotation] = result;
        expect(firstQuotation.baseCurrency).toBe(currency);
        expect(firstQuotation.quoteCurrency).toBe(currency);
        expect(firstQuotation.streamPair).toBe(streamPair);
        expect(firstQuotation.composedBy).toBeNull();
        expect(firstQuotation.buy).toBe(streamQuotationGateway.buy);
        expect(firstQuotation.sell).toBe(streamQuotationGateway.sell);
        expect(firstQuotation.gatewayName).toBe(streamPair.gatewayName);
        expect(firstQuotation.amount).toBe(streamQuotationGateway.amount);

        expect(
          mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        ).toHaveBeenCalledTimes(1);
        expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(1);
        expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
        expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      });

      it('TC0008 - Should create stream quotation - not enough natural quotations to build composed quotation', async () => {
        const {
          sut,
          mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
          mockCreateOrUpdateStreamQuotation,
          mockGetAllActiveIsTrueStreamPair,
          mockGetAllActiveCurrencies,
        } = makeSut();

        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { state: CurrencyState.ACTIVE },
        );

        const streamPair = await StreamPairFactory.create<StreamPairEntity>(
          StreamPairEntity.name,
          {
            baseCurrency: currency,
            quoteCurrency: currency,
            composedBy: null,
          },
        );

        const syntheticPair = await StreamPairFactory.create<StreamPairEntity>(
          StreamPairEntity.name,
          {
            baseCurrency: currency,
            quoteCurrency: currency,
            composedBy: [
              new StreamPairEntity({ id: streamPair.id }),
              new StreamPairEntity({ id: streamPair.id }),
            ],
          },
        );

        const streamQuotationGateway =
          await StreamQuotationGatewayFactory.create<StreamQuotationGatewayEntity>(
            StreamQuotationGatewayEntity.name,
          );

        mockGetAllActiveIsTrueStreamPair.mockResolvedValue([
          streamPair,
          syntheticPair,
        ]);
        mockGetAllActiveCurrencies.mockResolvedValue([currency, currency]);

        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName.mockResolvedValue(
          streamQuotationGateway,
        );

        const result = await sut.execute();

        expect(result).toBeDefined();
        expect(result.length).toBe(1);

        const [firstQuotation] = result;
        expect(firstQuotation.baseCurrency).toBe(currency);
        expect(firstQuotation.quoteCurrency).toBe(currency);
        expect(firstQuotation.streamPair).toBe(streamPair);
        expect(firstQuotation.composedBy).toBeNull();
        expect(firstQuotation.buy).toBe(streamQuotationGateway.buy);
        expect(firstQuotation.sell).toBe(streamQuotationGateway.sell);
        expect(firstQuotation.gatewayName).toBe(streamPair.gatewayName);
        expect(firstQuotation.amount).toBe(streamQuotationGateway.amount);

        expect(
          mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        ).toHaveBeenCalledTimes(1);
        expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(1);
        expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
        expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      });

      it('TC0009 - Should create stream quotation', async () => {
        const {
          sut,
          mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
          mockCreateOrUpdateStreamQuotation,
          mockGetAllActiveIsTrueStreamPair,
          mockGetAllActiveCurrencies,
        } = makeSut();

        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          { state: CurrencyState.ACTIVE },
        );

        const streamPair = await StreamPairFactory.create<StreamPairEntity>(
          StreamPairEntity.name,
          {
            baseCurrency: currency,
            quoteCurrency: currency,
            composedBy: null,
          },
        );

        const syntheticPair = await StreamPairFactory.create<StreamPairEntity>(
          StreamPairEntity.name,
          {
            baseCurrency: currency,
            quoteCurrency: currency,
            composedBy: [new StreamPairEntity({ id: streamPair.id })],
          },
        );

        const streamQuotationGateway =
          await StreamQuotationGatewayFactory.create<StreamQuotationGatewayEntity>(
            StreamQuotationGatewayEntity.name,
          );

        mockGetAllActiveIsTrueStreamPair.mockResolvedValue([
          streamPair,
          syntheticPair,
        ]);
        mockGetAllActiveCurrencies.mockResolvedValue([currency, currency]);

        mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName.mockResolvedValue(
          streamQuotationGateway,
        );

        const result = await sut.execute();

        expect(result).toBeDefined();
        expect(result.length).toBe(2);

        const [firstQuotation, secondQuotation] = result;
        expect(firstQuotation.baseCurrency).toBe(currency);
        expect(firstQuotation.quoteCurrency).toBe(currency);
        expect(firstQuotation.streamPair).toBe(streamPair);
        expect(firstQuotation.composedBy).toBeNull();
        expect(firstQuotation.buy).toBe(streamQuotationGateway.buy);
        expect(firstQuotation.sell).toBe(streamQuotationGateway.sell);
        expect(firstQuotation.gatewayName).toBe(streamPair.gatewayName);
        expect(firstQuotation.amount).toBe(streamQuotationGateway.amount);
        expect(secondQuotation.baseCurrency).toBe(currency);
        expect(secondQuotation.quoteCurrency).toBe(currency);
        expect(secondQuotation.streamPair).toBe(syntheticPair);
        expect(secondQuotation.composedBy).toEqual([firstQuotation]);
        expect(secondQuotation.buy).toBe(streamQuotationGateway.buy);
        expect(secondQuotation.sell).toBe(streamQuotationGateway.sell);
        expect(secondQuotation.gatewayName).toBe(syntheticPair.gatewayName);
        expect(secondQuotation.amount).toBe(1);

        expect(
          mockGetByBaseCurrencyAndQuoteCurrencyAndGatewayName,
        ).toHaveBeenCalledTimes(1);
        expect(mockCreateOrUpdateStreamQuotation).toHaveBeenCalledTimes(1);
        expect(mockGetAllActiveIsTrueStreamPair).toHaveBeenCalledTimes(1);
        expect(mockGetAllActiveCurrencies).toHaveBeenCalledTimes(1);
      });
    });
  });
});
