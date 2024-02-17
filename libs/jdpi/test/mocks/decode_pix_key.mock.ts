import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  JdpiAccountType,
  JdpiErrorTypes,
  JdpiKeyType,
  JdpiPersonType,
} from '@zro/jdpi/domain';
import { JdpiDecodedPixKeyResponse } from '@zro/jdpi/infrastructure';

export const success = () => {
  const data: Partial<JdpiDecodedPixKeyResponse> = {
    tpChave: JdpiKeyType.EVP,
    chave: faker.datatype.uuid(),
    ispb: faker.datatype.number(),
    nrAgencia: faker.datatype.string(),
    tpConta: JdpiAccountType.CACC,
    nrConta: faker.datatype.string(),
    dtHrAberturaConta: new Date(),
    tpPessoa: JdpiPersonType.LEGAL_PERSON,
    cpfCnpj: faker.datatype.number({ min: 1, max: 99999 }),
    nome: faker.datatype.string(),
    nomeFantasia: faker.datatype.string(),
    dtHrCriacaoChave: new Date(),
    dtHrInicioPosseChave: new Date(),
    endToEndId: faker.datatype.string(),
  };
  return Promise.resolve({ status: 200, data });
};

export const notFound = () => {
  const error = {
    response: {
      data: {
        cadigo: JdpiErrorTypes.NOT_FOUND,
        message: 'O Identificador para a consulta não está cadastrado.',
      },
    },
  };
  return Promise.reject(error);
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
