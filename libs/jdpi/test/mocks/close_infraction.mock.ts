import { faker } from '@faker-js/faker/locale/pt_BR';
import { JdpiErrorTypes, JdpiPixInfractionStatus } from '@zro/jdpi/domain';

export const success = () => {
  const data = {
    endToEndId: faker.datatype.uuid(),
    idRelatoInfracao: faker.datatype.uuid(),
    stRelatoInfracao: JdpiPixInfractionStatus.CLOSED,
    dtHrCriacaoRelatoInfracao: new Date(),
    dtHrUltModificacao: new Date(),
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
