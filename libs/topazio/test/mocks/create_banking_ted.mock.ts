export const success = () => {
  return Promise.resolve({ status: 200 });
};

export const offline = () => {
  const error = {
    message: 'Offline',
    response: {
      data: {
        type: 'ValidationError',
        message: 'Fake offline',
        errors: [
          {
            code: -26,
            message: 'An error occurred while sending the request',
          },
        ],
      },
    },
  };
  return Promise.reject(error);
};
