import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
    resultSet: [
      {
        id: 'TRD_1040',
        tradeIds: [faker.datatype.uuid(), faker.datatype.uuid()],
        externalName: faker.company.name(),
        externalIban: faker.finance.iban(),
        externalAddress: faker.address.streetAddress(),
        intermBankSwift: faker.finance.bic(),
        intermBankCity: faker.address.city(),
        intermBankName: faker.company.name(),
        intermBankAba: faker.finance.routingNumber(),
        receiverBankSwift: faker.finance.bic(),
        receiverBankCity: faker.address.city(),
        receiverBankAba: faker.finance.routingNumber(),
        receiverBankName: faker.company.name(),
        nature: faker.datatype.number(),
        country: faker.datatype.number(),
        averageBankFxRate: faker.datatype.number(),
        averageFxRate: faker.datatype.number(),
        averageSpot: faker.datatype.number(),
        clientReference: faker.random.alphaNumeric(),
        externalSettlementDate: new Date().toISOString(),
        internalSettlementDate: new Date().toISOString(),
        fxRate: 4.8104,
        internalValue: 43100.56,
        externalValue: 8959.87,
        iofValue: 163.782128,
        createdDate: new Date().toISOString(),
        status: 'I',
      },
    ],
    page: '1',
    perPage: '100',
    totalRegisters: 1,
    totalPages: 1,
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
