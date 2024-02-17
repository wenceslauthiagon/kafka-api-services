export const success = (_: string, order) => {
  const data = {
    client_order_id: order.client_order_id,
    quantity: order.quantity,
    executed_price: '20339.00000000',
  };

  return Promise.resolve({ status: 200, data });
};

export const rejectedOrder = (_: string, order) => {
  const data = {
    client_order_id: order.client_order_id,
    quantity: order.quantity,
    executed_price: null,
  };

  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: {
        errors: [
          {
            code: 1000,
            message:
              'Temporary connectivity issues. Please try again in a few seconds.',
          },
        ],
      },
    },
  };
  return Promise.reject(error);
};
