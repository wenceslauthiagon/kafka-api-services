import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = {
    base64_receipt:
      'dummy_refund_VGhpcyBpcyBhIG51bWJlciBvZiB0aGUgc3RyaW5nIGJhc2U2NCBpcyBub3QgYSBxdWVzdGlvbiB3aXRob3V0IGFyZSBkZXNpZ25lZCB0byBhIHN0cmluZyBiYXNlNjQu',
  };

  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: { code: -faker.datatype.number(), msg: 'Error message.' },
    },
  };

  return Promise.reject(error);
};

export const unauthorized = () => {
  const error = {
    isAxiosError: true,
    message: 'Unauthorized',
    response: {
      status: 403,
      data: { code: 403, msg: 'Not authorized. Header WALLET-ID Invalid!.' },
    },
  };

  return Promise.reject(error);
};
