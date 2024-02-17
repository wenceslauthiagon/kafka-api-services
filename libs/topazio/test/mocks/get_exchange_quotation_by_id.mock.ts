export const successApproved = (id: string) => {
  return Promise.resolve({
    status: 200,
    data: {
      resultSet: [
        {
          id,
          status: 4,
          partnerId: '12345678000123',
          partner: 'ZRO TEST',
          partnerType: 'COMERCIAL',
          currencyId: 220,
          internalSettlementDate: '2023-07-18T03:00:00.000Z',
          externalSettlementDate: '2023-07-18T03:00:00.000Z',
          operation: 'OUTBOUND',
          currency: 'USD',
          quotationId: '1234567893ec62b790ccd',
          fxRate: 4.8024,
          externalValue: 13473.4,
          internalValue: 64704.66,
          expiredDate: '2023-07-17T17:49:01.000Z',
          createdDate: '2023-07-17T17:44:01.000Z',
          lastAuthorizedBy: 204,
          lastAuthorizedUser: 'test@psp.com.br - CAMBIO TI',
          partnerOrderId: null,
          origin: 'API',
          originalPartner: 'ZRO TEST',
          originalPartnerId: '12345678000123',
        },
      ],
      page: 1,
      perPage: 100,
      totalRegisters: 1,
      totalPages: 1,
    },
  });
};

export const successCompleted = (id: string) => {
  return Promise.resolve({
    status: 200,
    data: {
      resultSet: [
        {
          id,
          status: 5,
          partnerId: '12345678000123',
          partner: 'ZRO TEST',
          partnerType: 'COMERCIAL',
          currencyId: 220,
          internalSettlementDate: '2023-07-18T03:00:00.000Z',
          externalSettlementDate: '2023-07-18T03:00:00.000Z',
          operation: 'OUTBOUND',
          currency: 'USD',
          quotationId: '1234567893ec62b790ccd',
          fxRate: 4.8024,
          externalValue: 13473.4,
          internalValue: 64704.66,
          expiredDate: '2023-07-17T17:49:01.000Z',
          createdDate: '2023-07-17T17:44:01.000Z',
          lastAuthorizedBy: 204,
          lastAuthorizedUser: 'test@psp.com.br - CAMBIO TI',
          partnerOrderId: null,
          origin: 'API',
          originalPartner: 'ZRO TEST',
          originalPartnerId: '12345678000123',
        },
      ],
      page: 1,
      perPage: 100,
      totalRegisters: 1,
      totalPages: 1,
    },
  });
};

export const notFound = (id: string) => {
  const error = {
    response: {
      data: {
        status: 404,
        timestamp: new Date().getTime(),
        path: `/api/v1/trade/${id}`,
        message: 'Trades not found.',
        codeError: 'QTM0000',
        additionalInfo: '',
      },
    },
  };

  return Promise.reject(error);
};
