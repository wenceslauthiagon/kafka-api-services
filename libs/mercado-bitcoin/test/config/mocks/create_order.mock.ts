import { MercadoBitcoinOrderStatus } from '@zro/mercado-bitcoin/domain';
import { v4 as uuidV4 } from 'uuid';

export const success = () => {
  const data = {
    orderId: uuidV4(),
    status: MercadoBitcoinOrderStatus.WORKING,
  };

  return Promise.resolve({ status: 200, data });
};

export const canceled = () => {
  const data = {
    orderId: uuidV4(),
    status: MercadoBitcoinOrderStatus.CANCELLED,
  };

  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: { message: 'Fake offline', code: 'DOMAIN|MODULE|ERROR' },
    },
  };
  return Promise.reject(error);
};
