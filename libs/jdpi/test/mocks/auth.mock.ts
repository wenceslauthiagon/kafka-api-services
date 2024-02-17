import { v4 as uuidV4 } from 'uuid';

export const oAuthToken = () => {
  const EXPIRES_IN = 5 * 24 * 3600; // Expires in 5 days

  return Promise.resolve({
    status: 200,
    data: {
      access_token: uuidV4(),
      token_type: 'Bearer',
      scope: 'dict_api,qrcode_api,spi_api',
      expires_in: EXPIRES_IN,
    },
  });
};
