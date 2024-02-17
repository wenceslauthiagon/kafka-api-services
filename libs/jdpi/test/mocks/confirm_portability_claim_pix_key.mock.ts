import { v4 as uuidV4 } from 'uuid';
import { JdpiConfirmPortabilityResponse } from '@zro/jdpi';
import { JdpiClaimStatusType, JdpiErrorTypes } from '@zro/jdpi/domain';

export const success = () => {
  const data: JdpiConfirmPortabilityResponse = {
    idReivindicacao: uuidV4(),
    stReivindicacao: JdpiClaimStatusType.CONFIRMED,
    motivoConfirmacao: null,
    motivoCancelamento: null,
    canceladaPor: null,
    dtHrLimiteResolucao: new Date(),
    dtHrLimiteConclusao: new Date(),
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
