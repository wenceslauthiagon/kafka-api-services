import { faker } from '@faker-js/faker/locale/pt_BR';
import { JdpiErrorTypes } from '@zro/jdpi/domain';

export const success = () => {
  const data = {
    payloadJws: faker.datatype.string(500),
  };

  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    response: {
      data: {
        codigo: JdpiErrorTypes.SERVICE_UNAVAILABLE,
        message: 'Fake offline',
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
