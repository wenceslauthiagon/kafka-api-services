import { v4 as uuidV4 } from 'uuid';
import { JdpiVerifyNotifyCreditPixStatementPspResponse } from '@zro/jdpi';
import { getMoment } from '@zro/common';
import { JdpiErrorTypes } from '@zro/jdpi/domain';

export const success = () => {
  const data: JdpiVerifyNotifyCreditPixStatementPspResponse = {
    endToEndId: uuidV4(),
    dtHrReqJdPi: getMoment().toISOString(),
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
