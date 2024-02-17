import {
  MercadoBitcoinOrderSide,
  MercadoBitcoinOrderStatus,
  MercadoBitcoinOrderType,
} from '@zro/mercado-bitcoin/domain';
import { v4 as uuidV4 } from 'uuid';

export const success = () => {
  const data = {
    avgPrice: 20339.0,
    created_at: new Date().getTime(),
    executions: [
      {
        executed_at: new Date().getTime(),
        fee_rate: '0.0005',
        id: uuidV4(),
        instrument: 'BTC-BRL',
        price: 21000.0,
        qty: '0.001',
        side: MercadoBitcoinOrderSide.BUY,
      },
    ],
    externalId: uuidV4(),
    fee: '0.0005',
    filledQty: '0.001',
    id: uuidV4(),
    instrument: 'BTC-BRL',
    limitPrice: null,
    qty: '0.001',
    side: MercadoBitcoinOrderSide.BUY,
    status: MercadoBitcoinOrderStatus.FILLED,
    stopPrice: null,
    triggerOrderId: null,
    type: MercadoBitcoinOrderType.MARKET,
    updated_at: new Date().getTime(),
  };

  return Promise.resolve({ status: 200, data });
};

export const notFound = () => {
  const error = {
    errors: [{ message: 'Not found', code: 'DOMAIN|MODULE|OFFLINE' }],
  };

  return Promise.reject(error);
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: { message: 'Fake offline', code: 'DOMAIN|MODULE|OFFLINE' },
    },
  };
  return Promise.reject(error);
};
