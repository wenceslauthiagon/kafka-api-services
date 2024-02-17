import { faker } from '@faker-js/faker/locale/pt_BR';
import { JdpiErrorTypes, JdpiPixInfractionStatus } from '@zro/jdpi/domain';
import { generateRandomEndToEndId } from '@zro/test/jdpi/utils/generate_random_end_to_end_id.util';

export const success = () => {
  const data = {
    endToEndId: generateRandomEndToEndId(),
    idRelatoInfracao: faker.datatype.uuid(),
    stRelatoInfracao: JdpiPixInfractionStatus.CANCELLED,
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
