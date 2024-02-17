import { v4 as uuidV4 } from 'uuid';

export const oAuthCode = () =>
  Promise.resolve({
    status: 200,
    data: { redirect_uri: uuidV4() },
  });

export const oAuthToken = () => {
  const ACCESS_TOKEN = uuidV4();
  const REFRESH_TOKEN = uuidV4();
  const EXPIRES_IN = 5 * 24 * 3600; // Expires in 5 days

  return Promise.resolve({
    status: 200,
    data: {
      access_token: ACCESS_TOKEN,
      refresh_token: REFRESH_TOKEN,
      expires_in: EXPIRES_IN,
    },
  });
};
