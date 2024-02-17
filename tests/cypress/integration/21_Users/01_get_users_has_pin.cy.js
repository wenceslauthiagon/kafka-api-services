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

  it('UC001 et users has pin ', async () => {
    const response = await _cy.get_request(env.users, headers);
    console.log(response);
    _cy.expect(response, 'has_pin');
  });
});
