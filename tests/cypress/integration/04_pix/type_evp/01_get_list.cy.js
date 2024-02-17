import { _cy } from '../../../support';
import { Env } from '../../../support/support';

describe('TC009 - Test -  api pix evp', () => {
  let env = Env();
  let headers;
  let token;

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  _cy._time(60000);

  it('UC001 - request get list all pix type EVP', async () => {
    const response = await _cy.get_request(env.pix, headers);
    _cy.expect(response, 'data');
    for (let inObject of response.body.data) {
      _cy.expect(inObject, 'id');
      _cy.expect(inObject, 'type');
      _cy.expect(inObject, 'state');
      _cy.expect(inObject, 'state_description');
      _cy.expect(inObject, 'created_at');
    }
  });
});
