import { v4 as uuidV4 } from 'uuid';

export const success = (_: string, quotation) => {
  const data = {
    rfq_id: uuidV4(),
    client_rfq_id: quotation.client_rfq_id,
    quantity: quotation.quantity,
    side: quotation.side,
    instrument: quotation.instrument,
    price: '19813.00000000',
    created: new Date(),
  };

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
