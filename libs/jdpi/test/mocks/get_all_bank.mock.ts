import { faker } from '@faker-js/faker/locale/pt_BR';
import { JdpiErrorTypes } from '@zro/jdpi/domain';

export const success = () => {
  const data = {
    resultado: [
      {
        ispb: faker.datatype.number({ min: 0 }),
        razaoSocial: faker.name.fullName(),
        nomeReduzido: faker.name.firstName(),
        tpPsp: faker.datatype.number({ min: 1, max: 2 }),
        modalidade: faker.datatype.number({ min: 1, max: 3 }),
        dtHrInicioPsp: faker.datatype.datetime(),
        dtHrFimPsp: faker.datatype.datetime(),
        stPsp: faker.datatype.number({ min: 1, max: 4 }),
      },
    ],
  };
  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.SERVICE_UNAVAILABLE,
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};

export const unexpectedError = () => {
  const error = {
    response: {
      data: {
        codigo: 'Unexpected Error',
        message: 'An error occurred while sending the request',
      },
    },
  };
  return Promise.reject(error);
};
