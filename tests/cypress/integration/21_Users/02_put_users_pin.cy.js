import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Test api pix devolutions - list users qrcode', () => {
  let env = Env();
  let headers;
  let token;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 get users has pin ', async () => {
    const createPin = {
      recaptcha_key: 'recaptcha-app-key',
      recaptcha_token: 'action-token',
      recaptcha_action: 'action-name',
      pin: '1234',
    };
    createPin.pin = _cy.generateString(4);
    const body = createPin;
    const response = await _cy.put_request(env.users_pin, body, headers);
    console.log(response);
  });
});
