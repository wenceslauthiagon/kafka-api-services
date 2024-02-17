export const success = () => {
  const data = {};
  return Promise.resolve({ status: 200, data });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: {
        type: 'ValidationError',
        message: 'Fake offline',
      },
    },
  };
  return Promise.reject(error);
};
