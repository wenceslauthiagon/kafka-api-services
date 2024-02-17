import { v4 as uuidV4 } from 'uuid';

export const oAuthToken = async () => {
  const ACCESS_TOKEN = uuidV4();

  return Promise.resolve({
    data: {
      success: true,
      data: {
        access_token: ACCESS_TOKEN,
      },
      error: null,
    },
  });
};
