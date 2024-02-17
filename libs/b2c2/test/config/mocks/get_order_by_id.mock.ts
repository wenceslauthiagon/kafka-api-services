import { v4 as uuidV4 } from 'uuid';

export const success = () => {
  const data = [
    {
      client_order_id: uuidV4(),
      quantity: '0.0005000000',
      executed_price: '20339.00000000',
    },
  ];

  return Promise.resolve({ status: 200, data });
};

export const notFound = () => {
  const error = {
    response: {
      data: { message: 'Not found', code: 1100 },
    },
  };
  return Promise.reject(error);
};

export const rejectedOrder = () => {
  const data = [
    {
      client_order_id: uuidV4(),
      quantity: '0.0005000000',
      executed_price: null,
    },
  ];

  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: { message: 'Fake offline' },
    },
  };
  return Promise.reject(error);
};
