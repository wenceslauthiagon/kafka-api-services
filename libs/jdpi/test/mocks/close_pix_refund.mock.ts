// import { v4 as uuidV4 } from 'uuid';
import { JdpiClosePixRefundResponse } from '@zro/jdpi';
import { JdpiErrorTypes } from '@zro/jdpi/domain';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { getMoment } from '@zro/common';
import { generateRandomEndToEndId } from '@zro/test/jdpi/utils/generate_random_end_to_end_id.util';

export const success = () => {
  const data: JdpiClosePixRefundResponse = {
    dtHrRespostaDict: getMoment().toISOString(),
    idCorrelacaoDict: generateRandomEndToEndId(),
    endToEndId: generateRandomEndToEndId(),
    motivo: 1,
    idSolDevolucao: faker.datatype.uuid(),
    idRelatoInfracao: faker.datatype.uuid(),
    stSolDevolucao: 2,
    ispbSolicitante: faker.datatype.number({ min: 99999, max: 9999999 }),
    ispbContestado: 26264220,
    dtHrCriacaoSolDevolucao: getMoment().toISOString(),
    dtHrUltModificacao: getMoment().toISOString(),
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
