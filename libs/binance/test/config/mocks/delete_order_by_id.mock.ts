import { faker } from '@faker-js/faker/locale/pt_BR';
const randomValue = () => {
  return `${faker.datatype.number({ min: 1, max: 999999 }) + '.00000000'}`;
};

export const success = () => {
  const data = {
    symbol: 'BTCBRL',
    origClientOrderId: faker.datatype.uuid(),
    orderId: 1234567,
    orderListId: -1,
    clientOrderId: 'fakeOrderId',
    transactTime: new Date().getTime(),
    price: randomValue(),
    origQty: randomValue(),
    executedQty: '0.00000000',
    cummulativeQuoteQty: '0.00000000',
    status: 'CANCELED',
    timeInForce: 'GTC',
    type: 'LIMIT',
    side: 'SELL',
    selfTradePreventionMode: 'NONE',
  };

  return Promise.resolve({ status: 200, data });
};

export const notFound = () => {
  const error = {
    message: 'Error message',
    response: {
      data: { code: -2011, msg: 'Unknown order sent.' },
    },
  };

  return Promise.reject(error);
};

export const offline = () => {
  const error = new Error();

  return Promise.reject(error);
};
