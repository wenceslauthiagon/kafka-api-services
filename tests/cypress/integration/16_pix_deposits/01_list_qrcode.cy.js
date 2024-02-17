import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Test api pix deposits - list users qrcode', () => {
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
  it('request to list qrcode', async () => {
    const response = await _cy.get_request(env.deposits_list_qrcode, headers);
    for (let validate of response.body.data.data) {
      _cy.expect(validate, 'id');
      _cy.expect(validate, 'key_id');
    }
  });
});
