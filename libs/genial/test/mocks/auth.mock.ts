import { v4 as uuidV4 } from 'uuid';

export const oAuthToken = async () => {
  const ACCESS_TOKEN = uuidV4();

  return Promise.resolve({
    success: true,
    data: { token: ACCESS_TOKEN },
    error: null,
  });
};
