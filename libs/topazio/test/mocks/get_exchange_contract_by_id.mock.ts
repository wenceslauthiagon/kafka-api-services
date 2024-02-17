import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
    resultSet: [
      {
        tradeIds: [faker.datatype.uuid(), faker.datatype.uuid()],
        id: 'TRD_1040',
        externalSettlementDate: '2023-07-18T03:00:00.000Z',
        internalSettlementDate: '2023-07-18T03:00:00.000Z',
        createdDate: '2023-07-18T14:27:33.000Z',
        country: 2496,
        status: 'I',
        fxRate: 4.8104,
        externalValue: 8959.87,
        internalValue: 43100.56,
        iofValue: 163.78,
        nature: 121860900590,
        intermBankName: 'Teste',
        externalName: 'Teste',
        externalAddress: 'Teste',
        externalIban: 'Teste',
        receiverBankSwift: 'Teste',
        receiverBankCity: 'Teste',
        receiverBankAba: 'Teste',
        intermBankSwift: 'Teste',
        intermBankCity: 'Teste',
        intermBankAba: 'Teste',
        clientReference: 'Teste',
        receiverBankName: 'Teste',
        bacenId: 'Teste',
      },
    ],
    page: '3',
    perPage: '2',
    totalRegisters: 6,
    totalPages: 3,
  };

  return Promise.resolve({ status: 201, data });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: {
        type: 'ValidationError',
        message: 'Fake offline',
        errors: [
          {
            code: -26,
            message: 'An error occurred while sending the request',
          },
        ],
      },
    },
  };
  return Promise.reject(error);
};
