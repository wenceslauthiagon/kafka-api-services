import { Env, Support as _cy } from '../../support/support';

describe('TC057 - Test api pix payments', () => {
  let env = Env();
  let headers;
  let file;
  let token;
  _cy._time(30000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get list all keys', async () => {
    const response = await _cy.get_request(env.pix, headers);
    for (let inObject of response.body.data) {
      _cy.expect(inObject, 'id');
      _cy.expect(inObject, 'key');
      _cy.expect(inObject, 'type');
      _cy.expect(inObject, 'state');
      _cy.expect(inObject, 'state_description');
      _cy.expect(inObject, 'created_at');
    }

    file = response.body.data;
  });
  it('create json file', async () => {
    await _cy.write_json('pix_deposits', 'list_keys', file);
  });
});
