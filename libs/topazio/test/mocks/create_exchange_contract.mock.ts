import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
    resultSet: {
      id: faker.datatype.uuid(),
      tradeIds: [faker.datatype.uuid(), faker.datatype.uuid()],
      externalName: faker.company.name(),
      externalIban: faker.finance.iban(),
      externalAddress: faker.address.streetAddress(),
      intermBankSwift: faker.finance.bic(),
      internalDocument: faker.datatype.number(),
      internalSettlementDate: new Date(),
      externalSettlementDate: new Date(),
      receiverBankSwift: faker.finance.bic(),
      receiverBankCity: faker.address.city(),
      nature: faker.datatype.number(),
      fxRate: faker.datatype.number(),
      country: faker.address.country(),
      createdDate: new Date(),
      externalValue: faker.datatype.number(),
      internalValue: faker.datatype.number(),
      iofValue: faker.datatype.number(),
      status: 'COMPLETED',
    },
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
