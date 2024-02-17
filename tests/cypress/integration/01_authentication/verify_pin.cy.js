import { pinPayload as _payload } from '../../payloads/authentication/verify_pin';
import { Env, Support as _cy } from '../../support/support';

describe('TC003 - Test - API Authentication - Verify pin user', () => {
  let env = Env();
  let headers;
  let token;
  let _body = _payload.body;

  _cy._time(30000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - validate pin user', async () => {
    const response = await _cy.post_request(env.verify_pin, _body, headers);
    _cy.expect(response, 'success', true);
  });

  it('UC002 - passing invalid code pin', async () => {
    let _pin = { ..._body };
    _pin.pin = '4321';
    const response = await _cy.post_request(env.verify_pin, _pin, headers);
    _cy.expect(response, 'message', 'Acesso negado.');
  });
});
