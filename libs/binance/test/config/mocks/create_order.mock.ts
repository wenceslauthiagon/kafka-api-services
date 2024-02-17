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
    transactTime: new Date().getTime(),
    price: '0.00000000',
    origQty: randomValue(),
    executedQty: randomValue(),
    cummulativeQuoteQty: randomValue(),
    status: 'FILLED',
    timeInForce: 'GTC',
    type: 'MARKET',
    side: 'SELL',
    workingTime: new Date().getTime(),
    fills: [
      {
        price: randomValue(),
        qty: randomValue(),
        commission: '0.00000000',
        commissionAsset: 'BRL',
        tradeId: 1234567,
      },
    ],
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
    transactTime: new Date().getTime(),
    price: randomValue(),
    origQty: randomValue(),
    executedQty: randomValue(),
    cummulativeQuoteQty: randomValue(),
    status: 'FILLED',
    timeInForce: 'GTC',
    type: 'LIMIT',
    side: 'SELL',
    workingTime: new Date().getTime(),
    fills: [
      {
        price: randomValue(),
        qty: '0.00100000',
        commission: '0.00000000',
        commissionAsset: 'BRL',
        tradeId: 1234567,
      },
    ],
    selfTradePreventionMode: 'NONE',
  };

  return Promise.resolve({ status: 200, data });
};

export const notFilledOrder = () => {
  const data = {
    symbol: 'BTCBUSD',
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
    side: 'BUY',
    workingTime: new Date().getTime(),
    fills: [],
    selfTradePreventionMode: 'NONE',
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
