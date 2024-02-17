import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
    resultSet: {
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
