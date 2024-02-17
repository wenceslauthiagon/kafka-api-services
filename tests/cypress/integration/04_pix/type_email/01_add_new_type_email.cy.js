import { MockEmail as _mock } from '../../../mocks/pix/add_new_type_email';
import { Email as _payload } from '../../../payloads/pix/type_email';
import { Env, Support as _cy } from '../../../support/support';

describe('TC008 - Test - api pix signup email', () => {
  let env = Env();
  let headers;
  let token;
  let id_signup;
  let id_confirm;
  let mock_confirmed = _mock.response;
  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  _cy._time(5000);
  it('UC001 - create new chave type EMAIL', async () => {
    const response = await _cy.post_request(
      env.pix,
      _payload.body_create,
      headers,
    );
    id_signup = _cy.expect(response, 'id');
    _cy.expect(response, 'state', 'PENDING');
  });

  it('UC002 - send code confirmation', async () => {
    const response = await _cy.get_request(
      `${env.pix}/${id_signup}/code`,
      headers,
    );
    _cy.expect(response, 'success', true);
  });

  it('UC003 - confirm code - state PENDING', async () => {
    const response = await _cy.post_request(
      `${env.pix}/${id_signup}/code`,
      _payload.body_confirm,
      headers,
    );
    id_confirm = _cy.findInJson(response, 'id');
    _cy.expect(response, 'id');
    _cy.expect(response, 'key');
    _cy.expect(response, 'state', 'PENDING');
    _cy.expect(response, 'type');
    _cy.expect(response, 'created_at');
  });

  it('UC004 - confrim code - state CONFIRMED', async () => {
    let response = { ...mock_confirmed };
    response.data.id = id_confirm;
    response.data.created_at = new Date().toISOString();
    _cy.expect(response, 'id');
    _cy.expect(response, 'key');
    _cy.expect(response, 'state', 'CONFIRMED');
    _cy.expect(response, 'type');
    _cy.expect(response, 'created_at');
  });

  it('UC005 - delete created key that has not been confirmed - state CANCELED ', async () => {
    const response = await _cy.delete_request(
      `${env.pix}/${id_signup}/code`,
      null,
      headers,
    );
    _cy.expect(response, 'id');
    _cy.expect(response, 'key');
    _cy.expect(response, 'state', 'CANCELED');
    _cy.expect(response, 'type');
    _cy.expect(response, 'created_at');
  });
});
