import { v4 as uuidV4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { JdpiErrorTypes, JdpiPixInfractionStatus } from '@zro/jdpi/domain';

export const success = () => {
  return Promise.resolve({
    status: 200,
    data: {
      idRelatoInfracao: uuidV4(),
      stRelatoInfracao: JdpiPixInfractionStatus.OPEN,
      pspCriador: faker.datatype.number({ max: 99999999 }),
      pspContraParte: faker.datatype.number({ max: 99999999 }),
      dtHrCriacaoRelatoInfracao: new Date(),
      dtHrUltModificacao: new Date(),
    },
  });
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
