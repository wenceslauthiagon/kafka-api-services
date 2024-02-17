import { v4 as uuidV4 } from 'uuid';
import { JdpiChannelType, JdpiErrorTypes } from '@zro/jdpi/domain';
import { JdpiCreatePaymentPixPaymentResponse } from '@zro/jdpi';

export const success = () => {
  const data: JdpiCreatePaymentPixPaymentResponse = {
    idReqSistemaCliente: uuidV4(),
    idReqJdPi: uuidV4(),
    endToEndId: uuidV4(),
    dtHrReqJdPi: new Date(),
    tpCanal: JdpiChannelType.CPM,
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
