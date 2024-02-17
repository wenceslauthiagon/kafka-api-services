import { faker } from '@faker-js/faker/locale/pt_BR';

export const success = () => {
  const data = [
    {
      type: 'transaction',
      status: 'paid_without_qr_code',
      total_items: 3,
      total_value: 2397,
    },
    {
      type: 'withdraw',
      status: 'paid',
      total_items: 24,
      total_value: 35366,
    },
    {
      type: 'transaction',
      status: 'paid_by_third_party',
      total_items: 8,
      total_value: 4605,
    },
    {
      type: 'withdraw',
      status: 'failed',
      total_items: 8,
      total_value: 11884,
    },
    {
      type: 'refund',
      status: 'failed',
      total_items: 3,
      total_value: 3764,
    },
    {
      type: 'transaction',
      status: 'failed',
      total_items: 5,
      total_value: 7167,
    },
    {
      type: 'returned',
      status: 'paid',
      total_items: 23,
      total_value: 32893,
    },
    {
      type: 'returned',
      status: 'paid',
      total_items: 28,
      total_value: 30816,
    },
    {
      type: 'transaction',
      status: 'paid',
      total_items: 35,
      total_value: 10014,
    },
  ];

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
