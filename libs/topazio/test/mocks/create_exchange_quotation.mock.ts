import { v4 as uuidV4 } from 'uuid';

export const success = () => {
  const data = {
    resultSet: {
      id: uuidV4(),
      status: 0,
      operation: 'INBOUND',
      internalSettlementDate: '2022-09-13T17:55:21.581Z',
      externalSettlementDate: '2022-09-13T17:55:21.581Z',
      lastAuthorized: 0,
      createdDate: '2022-09-13T17:55:21.581Z',
      expiredDate: '2022-09-13T17:55:21.581Z',
      timeExpired: 300,
      quotationId: '6320c78b1d3dfc1818938feb',
      fxRate: 0,
      internalValue: 0,
      externalValue: 0,
      partnerId: 0,
      callbackUrl: 'http://url_post_callback_partner/',
    },
  };

  return Promise.resolve({ status: 201, data });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: {
        type: 'ValidationError',
        message: 'Fake offline',
        errors: [
          {
            code: -26,
            message: 'An error occurred while sending the request',
          },
        ],
      },
    },
  };
  return Promise.reject(error);
};
