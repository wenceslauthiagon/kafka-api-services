import { JdpiGetPixRefundResponse } from '@zro/jdpi';
import { JdpiErrorTypes } from '@zro/jdpi/domain';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { getMoment } from '@zro/common';
import { generateRandomEndToEndId } from '@zro/test/jdpi/utils/generate_random_end_to_end_id.util';

export const success = () => {
  const data: JdpiGetPixRefundResponse = {
    dtHrJdPi: getMoment().toISOString(),
    solicitacoesDevolucao: [
      {
        endToEndId: generateRandomEndToEndId(),
        motivo: 1,
        valorDevolucao: faker.datatype.number({ min: 9, max: 9999 }),
        detalhes: 'Houve fraude confirmada na transação.',
        idSolDevolucao: faker.datatype.uuid(),
        idRelatoInfracao: faker.datatype.uuid(),
        stSolDevolucao: 0,
        ispbSolicitante: faker.datatype.number({ min: 99999, max: 9999999 }),
        ispbContestado: 26264220,
        dtHrCriacaoSolDevolucao: getMoment().toISOString(),
        dtHrUltModificacao: getMoment().toISOString(),
      },
      {
        endToEndId: generateRandomEndToEndId(),
        motivo: 1,
        valorDevolucao: faker.datatype.number({ min: 9, max: 9999 }),
        detalhes: 'Houve fraude confirmada na transação.',
        idSolDevolucao: faker.datatype.uuid(),
        idRelatoInfracao: faker.datatype.uuid(),
        stSolDevolucao: 2,
        ispbSolicitante: faker.datatype.number({ min: 99999, max: 9999999 }),
        ispbContestado: 26264220,
        dtHrCriacaoSolDevolucao: getMoment().toISOString(),
        dtHrUltModificacao: getMoment().toISOString(),
        resultadoAnalise: 1,
        detalhesAnalise:
          'Tentativa de devolução realizada, porém, sem saldo disponível',
        motivoRejeicao: 0,
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
