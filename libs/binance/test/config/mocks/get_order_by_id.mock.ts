import { faker } from '@faker-js/faker/locale/pt_BR';
const randomValue = () => {
  return `${faker.datatype.number({ min: 1, max: 999999 }) + '.00000000'}`;
};

export const successMarket = () => {
  const data = {
    symbol: 'BTCBRL',
    orderId: 1234567,
    orderListId: -1,
    clientOrderId: faker.datatype.uuid(),
    price: '0.00000000',
    origQty: randomValue(),
    executedQty: randomValue(),
    cummulativeQuoteQty: randomValue(),
    status: 'FILLED',
    timeInForce: 'GTC',
    type: 'MARKET',
    side: 'BUY',
    stopPrice: '0.00000000',
    icebergQty: '0.00000000',
    time: new Date().getTime(),
    updateTime: new Date().getTime(),
    isWorking: true,
    workingTime: new Date().getTime(),
    origQuoteOrderQty: '0.00000000',
    selfTradePreventionMode: 'NONE',
  };

  return Promise.resolve({ status: 200, data });
};

export const successLimit = () => {
  const data = {
    symbol: 'BTCBRL',
    orderId: 1234567,
    orderListId: -1,
    clientOrderId: faker.datatype.uuid(),
    price: randomValue(),
    origQty: randomValue(),
    executedQty: randomValue(),
    cummulativeQuoteQty: randomValue(),
    status: 'FILLED',
    timeInForce: 'FOK',
    type: 'LIMIT',
    side: 'SELL',
    stopPrice: '0.00000000',
    icebergQty: '0.00000000',
    time: new Date().getTime(),
    updateTime: new Date().getTime(),
    isWorking: true,
    workingTime: new Date().getTime(),
    origQuoteOrderQty: '0.00000000',
    selfTradePreventionMode: 'NONE',
  };

  return Promise.resolve({ status: 200, data });
};

export const notFilledOrder = () => {
  const data = {
    symbol: 'BTCBRL',
    orderId: 1234567,
    orderListId: -1,
    clientOrderId: faker.datatype.uuid(),
    transactTime: new Date().getTime(),
    price: randomValue(),
    origQty: randomValue(),
    executedQty: '0.00000000',
    cummulativeQuoteQty: '0.00000000',
    status: 'EXPIRED',
    timeInForce: 'FOK',
    type: 'LIMIT',
    side: 'SELL',
    workingTime: new Date().getTime(),
    fills: [],
    selfTradePreventionMode: 'NONE',
  };

  return Promise.resolve({ status: 200, data });
};

export const notFound = () => {
  const error = {
    message: 'Offline',
    response: {
      data: { code: -2013, msg: 'Order does not exist.' },
    },
  };

  return Promise.reject(error);
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
