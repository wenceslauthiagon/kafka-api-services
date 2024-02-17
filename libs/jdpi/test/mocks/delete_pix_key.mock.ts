import { JdpiErrorTypes } from '@zro/jdpi/domain';
import { JdpiDeletePixKeyRequest } from '@zro/jdpi';

export const success = (_: string, body: JdpiDeletePixKeyRequest) => {
  const data = { chave: body.chave };

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
