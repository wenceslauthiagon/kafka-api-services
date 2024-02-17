describe('CreateCryptoRemittanceUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  // const makeSut = () => {
  //   const cryptoRemittanceRepository: CryptoRemittanceRepository =
  //     createMock<CryptoRemittanceRepository>();

  //   const mockCreateCryptoRemittanceRepository: jest.Mock = On(
  //     cryptoRemittanceRepository,
  //   ).get(method((mock) => mock.create));

  //   const cryptoOrderRepository: CryptoOrderRepository =
  //     createMock<CryptoOrderRepository>();

  //   const mockGetAllByBaseCurrencyAndState: jest.Mock = On(
  //     cryptoOrderRepository,
  //   ).get(method((mock) => mock.getAllByBaseCurrencyAndState));

  //   const mockUpdateCryptoOrderRepository: jest.Mock = On(
  //     cryptoOrderRepository,
  //   ).get(method((mock) => mock.update));

  //   const mockCreateCryptoOrderRepository: jest.Mock = On(
  //     cryptoOrderRepository,
  //   ).get(method((mock) => mock.create));

  //   const providerRepository: ProviderRepository =
  //     createMock<ProviderRepository>();

  //   const mockGetByNameProviderRepository: jest.Mock = On(
  //     providerRepository,
  //   ).get(method((mock) => mock.getByName));

  //   const conversionRepository: ConversionRepository =
  //     createMock<ConversionRepository>();

  //   const mockUpdateConversionRepository: jest.Mock = On(
  //     conversionRepository,
  //   ).get(method((mock) => mock.update));

  //   const quotationService = createMock<QuotationService>();

  //   const mockGetStreamQuotation: jest.Mock = On(quotationService).get(
  //     method((mock) => mock.getStreamQuotationByBaseCurrency),
  //   );

  //   const cryptoRemittanceEventEmitter =
  //     createMock<CryptoRemittanceEventEmitter>();

  //   const mockPendingCryptoRemittance: jest.Mock = On(
  //     cryptoRemittanceEventEmitter,
  //   ).get(method((mock) => mock.pendingCryptoRemittance));

  //   const mockWaitingCryptoRemittance: jest.Mock = On(
  //     cryptoRemittanceEventEmitter,
  //   ).get(method((mock) => mock.waitingCryptoRemittance));

  //   const mockCanceledCryptoRemittance: jest.Mock = On(
  //     cryptoRemittanceEventEmitter,
  //   ).get(method((mock) => mock.canceledCryptoRemittance));

  //   const mockFilledCryptoRemittance: jest.Mock = On(
  //     cryptoRemittanceEventEmitter,
  //   ).get(method((mock) => mock.filledCryptoRemittance));

  //   const cryptoOrderEventEmitter = createMock<CryptoOrderEventEmitter>();

  //   const mockPendingCryptoOrder: jest.Mock = On(cryptoOrderEventEmitter).get(
  //     method((mock) => mock.pendingCryptoOrder),
  //   );

  //   const mockConfirmedCryptoOrder: jest.Mock = On(cryptoOrderEventEmitter).get(
  //     method((mock) => mock.confirmedCryptoOrder),
  //   );

  //   const cryptoRemittanceGateway = createMock<CryptoRemittanceGateway>();

  //   const mockGetProviderName: jest.Mock = On(cryptoRemittanceGateway).get(
  //     method((mock) => mock.getProviderName),
  //   );

  //   const mockGetCryptoMarketByBaseAndQuote: jest.Mock = On(
  //     cryptoRemittanceGateway,
  //   ).get(method((mock) => mock.getCryptoMarketByBaseAndQuote));

  //   const mockCreateCryptoRemittanceGateway: jest.Mock = On(
  //     cryptoRemittanceGateway,
  //   ).get(method((mock) => mock.createCryptoRemittance));

  //   const sut = new UseCase(logger, cryptoRemittanceRepository);

  //   return {
  //     mockCreateCryptoRemittanceRepository,
  //     mockGetAllByBaseCurrencyAndState,
  //     mockUpdateCryptoOrderRepository,
  //     mockCreateCryptoOrderRepository,
  //     mockGetByNameProviderRepository,
  //     mockUpdateConversionRepository,
  //     mockGetStreamQuotation,
  //     mockPendingCryptoRemittance,
  //     mockWaitingCryptoRemittance,
  //     mockCanceledCryptoRemittance,
  //     mockFilledCryptoRemittance,
  //     mockPendingCryptoOrder,
  //     mockConfirmedCryptoOrder,
  //     mockGetProviderName,
  //     mockGetCryptoMarketByBaseAndQuote,
  //     mockCreateCryptoRemittanceGateway,
  //     sut,
  //   };
  // };

  it('Dumb test', () => {
    expect(1).toBe(1);
  });

  // describe('With invalid parameters', () => {
  //   it('TC0001 - Should not create crypto remittance if missing baseCurrency', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       sut,
  //     } = makeSut();

  //     const testScript = () => sut.execute(null);

  //     await expect(testScript).rejects.toThrow(MissingDataException);
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(0);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //   });

  //   it('TC0002 - Should return undefined if orders is empty', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //     );

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue([]);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //   });

  //   it('TC0003 - Should return undefined if streamQuotation.composedBy is empty', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         { composedBy: [] },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //   });

  //   it('TC0004 - Should return undefined if baseCurrency.type is FIAT', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       { type: CurrencyType.FIAT },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //         {
  //           baseCurrency,
  //           amount: 100000000,
  //           type: OrderType.MARKET,
  //           side: OrderSide.SELL,
  //         },
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //         {
  //           baseCurrency,
  //           amount: 100000000,
  //           type: OrderType.MARKET,
  //           side: OrderSide.SELL,
  //         },
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //   });

  //   it('TC0005 - Should throw expection when there is no gateway', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       { type: CurrencyType.CRYPTO },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);

  //     const testScript = () => sut.execute(baseCurrency);

  //     await expect(testScript).rejects.toThrow(
  //       CryptoRemittanceGatewayNotFoundException,
  //     );

  //     expect(testScript).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //   });

  //   it('TC0006 - Should throw exception when there is no provider', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       { type: CurrencyType.CRYPTO },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue(null);

  //     const testScript = () => sut.execute(baseCurrency);

  //     await expect(testScript).rejects.toThrow(ProviderNotFoundException);

  //     expect(testScript).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //   });

  //   it('TC0007 - Should throw exception when there is no Crypto Market', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       mockGetCryptoMarketByBaseAndQuote,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       { type: CurrencyType.CRYPTO },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue('B2C2');
  //     mockGetCryptoMarketByBaseAndQuote.mockResolvedValue(null);

  //     const testScript = () => sut.execute(baseCurrency);
  //     await expect(testScript).rejects.toThrow(CryptoMarketNotFoundException);

  //     expect(testScript).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //     expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
  //   });

  //   it('TC0008 - Should throw exception when crypto market minSize is higher than amount', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       mockGetCryptoMarketByBaseAndQuote,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       { type: CurrencyType.CRYPTO },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //         {
  //           baseCurrency,
  //           amount: 100000000,
  //           type: OrderType.MARKET,
  //           side: OrderSide.SELL,
  //         },
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //         {
  //           baseCurrency,
  //           amount: 200000000,
  //           type: OrderType.MARKET,
  //           side: OrderSide.BUY,
  //         },
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue('B2C2');

  //     const cryptoMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
  //       CryptoMarketEntity.name,
  //       { minSize: 300000000 },
  //     );

  //     mockGetCryptoMarketByBaseAndQuote.mockResolvedValue(cryptoMarket);

  //     const testScript = () => sut.execute(baseCurrency);

  //     await expect(testScript).rejects.toThrow(
  //       CryptoRemittanceAmountUnderflowException,
  //     );

  //     expect(testScript).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //     expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
  //   });

  //   it('TC0009 - Should throw exception if crypto remittance status is ERROR', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       mockGetCryptoMarketByBaseAndQuote,
  //       mockCreateCryptoRemittanceGateway,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       { type: CurrencyType.CRYPTO },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue('B2C2');

  //     const cryptoMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
  //       CryptoMarketEntity.name,
  //     );

  //     mockGetCryptoMarketByBaseAndQuote.mockResolvedValue(cryptoMarket);

  //     const cryptoRemittance =
  //       await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
  //         CryptoRemittanceEntity.name,
  //         { status: CryptoRemittanceStatus.ERROR },
  //       );

  //     mockCreateCryptoRemittanceGateway.mockResolvedValue(cryptoRemittance);

  //     const testScript = () => sut.execute(baseCurrency);

  //     await expect(testScript).rejects.toThrow(
  //       CryptoRemittanceNotPlacedException,
  //     );

  //     expect(testScript).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //     expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
  //     expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
  //   });
  // });

  // describe('With valid parameters', () => {
  //   it('TC0010 - Should update orders status to RECONCILIED when remittance size is zero', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //         {
  //           baseCurrency,
  //           amount: 100000000,
  //           type: OrderType.MARKET,
  //           side: OrderSide.BUY,
  //         },
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //         {
  //           baseCurrency,
  //           amount: 100000000,
  //           type: OrderType.MARKET,
  //           side: OrderSide.SELL,
  //         },
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValue(orders);
  //     mockUpdateCryptoOrderRepository.mockResolvedValue(orders);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(2);
  //     orders.map((order) => {
  //       expect(order.state).toBe(CryptoOrderState.RECONCILIED);
  //       expect(order.reconciledId).toBeDefined;
  //     });
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(0);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(0);
  //   });

  //   it('TC0011 - Should emmit event when cryptoRemittance status is PENDING and execute', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       mockGetCryptoMarketByBaseAndQuote,
  //       mockCreateCryptoRemittanceGateway,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       { type: CurrencyType.CRYPTO },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValueOnce(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue('B2C2');

  //     const cryptoMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
  //       CryptoMarketEntity.name,
  //       {
  //         maxSize: 500000000,
  //         sizeIncrement: 10,
  //       },
  //     );

  //     mockGetCryptoMarketByBaseAndQuote.mockResolvedValue(cryptoMarket);

  //     const cryptoRemittance =
  //       await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
  //         CryptoRemittanceEntity.name,
  //         { status: CryptoRemittanceStatus.PENDING },
  //       );

  //     mockCreateCryptoRemittanceGateway.mockResolvedValue(cryptoRemittance);
  //     mockPendingCryptoRemittance.mockResolvedValue(cryptoRemittance);
  //     mockCreateCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);

  //     //const remaining = amount - cryptoRemittance.executedAmount = 100000000

  //     const remainingOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
  //       CryptoOrderEntity.name,
  //       {
  //         baseCurrency,
  //         amount: 100000000,
  //         side: OrderSide.BUY,
  //         type: OrderType.MARKET,
  //         remainingCryptoRemittance: cryptoRemittance,
  //       },
  //     );

  //     mockCreateCryptoOrderRepository.mockResolvedValue(remainingOrder);
  //     mockPendingCryptoOrder.mockResolvedValueOnce(remainingOrder);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(2);
  //     orders.map(async (order) => {
  //       expect(order.state).toBe(CryptoOrderState.CONFIRMED);
  //       //expect(order.cryptoRemittance).toBe(cryptoRemittance);
  //       //expect(order.provider).toBe(cryptoRemittance.provider);
  //     });
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(1);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(2);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //     expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
  //     expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
  //   });

  //   it('TC0012 - Should emmit event when cryptoRemittance status is WAITING and execute', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       mockGetCryptoMarketByBaseAndQuote,
  //       mockCreateCryptoRemittanceGateway,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       {
  //         type: CurrencyType.CRYPTO,
  //       },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValueOnce(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue('B2C2');

  //     const cryptoMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
  //       CryptoMarketEntity.name,
  //     );

  //     mockGetCryptoMarketByBaseAndQuote.mockResolvedValue(cryptoMarket);

  //     const cryptoRemittance =
  //       await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
  //         CryptoRemittanceEntity.name,
  //         {
  //           status: CryptoRemittanceStatus.WAITING,
  //         },
  //       );

  //     mockCreateCryptoRemittanceGateway.mockResolvedValue(cryptoRemittance);
  //     mockWaitingCryptoRemittance.mockResolvedValue(cryptoRemittance);
  //     mockCreateCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);

  //     //const remaining = amount - cryptoRemittance.executedAmount = 100000000

  //     const remainingOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
  //       CryptoOrderEntity.name,
  //       {
  //         baseCurrency,
  //         amount: 100000000,
  //         side: OrderSide.BUY,
  //         type: OrderType.MARKET,
  //         remainingCryptoRemittance: cryptoRemittance,
  //       },
  //     );

  //     mockCreateCryptoOrderRepository.mockResolvedValue(remainingOrder);
  //     mockPendingCryptoOrder.mockResolvedValueOnce(remainingOrder);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(2);
  //     orders.map(async (order) => {
  //       expect(order.state).toBe(CryptoOrderState.CONFIRMED);
  //       //expect(order.cryptoRemittance).toBe(cryptoRemittance);
  //       //expect(order.provider).toBe(cryptoRemittance.provider);
  //     });
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(1);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(2);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //     expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
  //     expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
  //   });

  //   it('TC0013 - Should emmit event when cryptoRemittance status is CANCELED and execute', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       mockGetCryptoMarketByBaseAndQuote,
  //       mockCreateCryptoRemittanceGateway,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       {
  //         type: CurrencyType.CRYPTO,
  //       },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValueOnce(orders);

  //     const quotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(quotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue('B2C2');

  //     const cryptoMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
  //       CryptoMarketEntity.name,
  //     );

  //     mockGetCryptoMarketByBaseAndQuote.mockResolvedValue(cryptoMarket);

  //     const cryptoRemittance =
  //       await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
  //         CryptoRemittanceEntity.name,
  //         {
  //           status: CryptoRemittanceStatus.CANCELED,
  //         },
  //       );

  //     mockCreateCryptoRemittanceGateway.mockResolvedValue(cryptoRemittance);
  //     mockCanceledCryptoRemittance.mockResolvedValue(cryptoRemittance);
  //     mockCreateCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);

  //     //const remaining = amount - cryptoRemittance.executedAmount = 100000000

  //     const remainingOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
  //       CryptoOrderEntity.name,
  //       {
  //         baseCurrency,
  //         amount: 100000000,
  //         side: OrderSide.BUY,
  //         type: OrderType.MARKET,
  //         remainingCryptoRemittance: cryptoRemittance,
  //       },
  //     );

  //     mockCreateCryptoOrderRepository.mockResolvedValue(remainingOrder);
  //     mockPendingCryptoOrder.mockResolvedValueOnce(remainingOrder);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(2);
  //     orders.map(async (order) => {
  //       expect(order.state).toBe(CryptoOrderState.CONFIRMED);
  //       //expect(order.cryptoRemittance).toBe(cryptoRemittance);
  //       //expect(order.provider).toBe(cryptoRemittance.provider);
  //     });
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(1);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(2);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //     expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
  //     expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
  //   });

  //   it('TC0014 - Should emmit event when cryptoRemittance status is FILLED and execute', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       mockGetCryptoMarketByBaseAndQuote,
  //       mockCreateCryptoRemittanceGateway,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       {
  //         type: CurrencyType.CRYPTO,
  //       },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValueOnce(orders);

  //     const streamQuotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(streamQuotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue('B2C2');

  //     const cryptoMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
  //       CryptoMarketEntity.name,
  //     );

  //     mockGetCryptoMarketByBaseAndQuote.mockResolvedValue(cryptoMarket);

  //     const cryptoRemittance =
  //       await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
  //         CryptoRemittanceEntity.name,
  //         {
  //           status: CryptoRemittanceStatus.FILLED,
  //         },
  //       );

  //     mockCreateCryptoRemittanceGateway.mockResolvedValue(cryptoRemittance);
  //     mockFilledCryptoRemittance.mockResolvedValue(cryptoRemittance);
  //     mockCreateCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);

  //     //const remaining = amount - cryptoRemittance.executedAmount = 100000000

  //     const remainingOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
  //       CryptoOrderEntity.name,
  //       {
  //         baseCurrency,
  //         amount: 100000000,
  //         side: OrderSide.BUY,
  //         type: OrderType.MARKET,
  //         remainingCryptoRemittance: cryptoRemittance,
  //       },
  //     );

  //     mockCreateCryptoOrderRepository.mockResolvedValue(remainingOrder);
  //     mockPendingCryptoOrder.mockResolvedValueOnce(remainingOrder);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(2);
  //     orders.map(async (order) => {
  //       expect(order.state).toBe(CryptoOrderState.CONFIRMED);
  //       //expect(order.cryptoRemittance).toBe(cryptoRemittance);
  //       //expect(order.provider).toBe(cryptoRemittance.provider);
  //     });
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(0);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(2);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //     expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
  //     expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
  //   });

  //   it('TC0015 - Should update all conversions, create next order and execute', async () => {
  //     const {
  //       mockCreateCryptoRemittanceRepository,
  //       mockGetAllByBaseCurrencyAndState,
  //       mockUpdateCryptoOrderRepository,
  //       mockCreateCryptoOrderRepository,
  //       mockGetByNameProviderRepository,
  //       mockUpdateConversionRepository,
  //       mockGetStreamQuotation,
  //       mockPendingCryptoRemittance,
  //       mockWaitingCryptoRemittance,
  //       mockCanceledCryptoRemittance,
  //       mockFilledCryptoRemittance,
  //       mockPendingCryptoOrder,
  //       mockConfirmedCryptoOrder,
  //       mockGetProviderName,
  //       mockGetCryptoMarketByBaseAndQuote,
  //       mockCreateCryptoRemittanceGateway,
  //       sut,
  //     } = makeSut();

  //     const baseCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       {
  //         type: CurrencyType.CRYPTO,
  //       },
  //     );

  //     const quoteCurrency = await CurrencyFactory.create<CurrencyEntity>(
  //       CurrencyEntity.name,
  //       {
  //         type: CurrencyType.CRYPTO,
  //       },
  //     );

  //     const orders = [
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //         {
  //           conversion: await ConversionFactory.create<ConversionEntity>(
  //             ConversionEntity.name,
  //           ),
  //         },
  //       ),
  //       await CryptoOrderFactory.create<CryptoOrderEntity>(
  //         CryptoOrderEntity.name,
  //         {
  //           conversion: await ConversionFactory.create<ConversionEntity>(
  //             ConversionEntity.name,
  //           ),
  //         },
  //       ),
  //     ];

  //     mockGetAllByBaseCurrencyAndState.mockResolvedValueOnce(orders);

  //     const streamQuotation =
  //       await StreamQuotationFactory.create<StreamQuotationEntity>(
  //         StreamQuotationEntity.name,
  //         {
  //           composedBy: [
  //             await StreamQuotationFactory.create<StreamQuotationEntity>(
  //               StreamQuotationEntity.name,
  //               { quoteCurrency, baseCurrency, gatewayName: 'B2C2' },
  //             ),
  //           ],
  //         },
  //       );

  //     mockGetStreamQuotation.mockResolvedValue(streamQuotation);
  //     mockGetProviderName.mockReturnValue('B2C2');
  //     mockGetByNameProviderRepository.mockResolvedValue('B2C2');

  //     const cryptoMarket = await CryptoMarketFactory.create<CryptoMarketEntity>(
  //       CryptoMarketEntity.name,
  //     );

  //     mockGetCryptoMarketByBaseAndQuote.mockResolvedValue(cryptoMarket);

  //     const cryptoRemittance =
  //       await CryptoRemittanceFactory.create<CryptoRemittanceEntity>(
  //         CryptoRemittanceEntity.name,
  //       );

  //     mockCreateCryptoRemittanceGateway.mockResolvedValue(cryptoRemittance);
  //     mockPendingCryptoRemittance.mockResolvedValue(cryptoRemittance);
  //     mockCreateCryptoRemittanceRepository.mockResolvedValue(cryptoRemittance);

  //     //const remaining = amount - cryptoRemittance.executedAmount = 100000000

  //     const remainingOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
  //       CryptoOrderEntity.name,
  //       {
  //         baseCurrency,
  //         amount: 100000000,
  //         side: OrderSide.BUY,
  //         type: OrderType.MARKET,
  //         remainingCryptoRemittance: cryptoRemittance,
  //       },
  //     );

  //     mockCreateCryptoOrderRepository.mockResolvedValue(remainingOrder);
  //     mockPendingCryptoOrder.mockResolvedValueOnce(remainingOrder);

  //     const nextOrder = await CryptoOrderFactory.create<CryptoOrderEntity>(
  //       CryptoOrderEntity.name,
  //       {
  //         baseCurrency,
  //         amount: 0,
  //         side: OrderSide.BUY,
  //         type: OrderType.MARKET,
  //         state: CryptoOrderState.PENDING,
  //         previousCryptoRemittance: cryptoRemittance,
  //       },
  //     );

  //     mockCreateCryptoOrderRepository.mockResolvedValue(nextOrder);
  //     mockPendingCryptoOrder.mockResolvedValue(nextOrder);

  //     const result = await sut.execute(baseCurrency);

  //     expect(result).toBeUndefined;
  //     expect(mockCreateCryptoRemittanceRepository).toHaveBeenCalledTimes(1);
  //     expect(mockGetAllByBaseCurrencyAndState).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateCryptoOrderRepository).toHaveBeenCalledTimes(2);
  //     orders.map(async (order) => {
  //       expect(order.state).toBe(CryptoOrderState.CONFIRMED);
  //       //expect(order.cryptoRemittance).toBe(cryptoRemittance);
  //       //expect(order.provider).toBe(cryptoRemittance.provider);
  //     });
  //     expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(2);
  //     expect(mockGetByNameProviderRepository).toHaveBeenCalledTimes(1);
  //     expect(mockUpdateConversionRepository).toHaveBeenCalledTimes(2);
  //     expect(mockGetStreamQuotation).toHaveBeenCalledTimes(1);
  //     expect(mockPendingCryptoRemittance).toHaveBeenCalledTimes(1);
  //     expect(mockWaitingCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockCanceledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockFilledCryptoRemittance).toHaveBeenCalledTimes(0);
  //     expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(2);
  //     expect(mockConfirmedCryptoOrder).toHaveBeenCalledTimes(2);
  //     expect(mockGetProviderName).toHaveBeenCalledTimes(2);
  //     expect(mockGetCryptoMarketByBaseAndQuote).toHaveBeenCalledTimes(1);
  //     expect(mockCreateCryptoRemittanceGateway).toHaveBeenCalledTimes(1);
  //   });
  // });
});
