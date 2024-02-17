import { StateTypeEvp as _state } from '../../../mocks/pix/get_by_id';
import { Env, Support as _cy } from '../../../support/support';

describe('TC011 - Test - api pix type evp signup', () => {
  let env = Env();
  let headers;
  let token;
  let id;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    id = await _cy.read_json('pix_key', 'pix_evp_id');
  });
  _cy._time(60000);

  it('UC001 - Get pix type evp ID', async () => {
    const response = await _cy.get_request(`${env.pix}/${id.id}`, headers);
    _cy.expect(response, 'id');
    const state = _cy.findInJson(response, 'state');
    if (state === _state.state_one) {
      _cy.expect(response, 'state', _state.state_one);
    } else if (state === _state.state_two) {
      _cy.expect(response, 'state', _state.state_two);
    }
  });
});
