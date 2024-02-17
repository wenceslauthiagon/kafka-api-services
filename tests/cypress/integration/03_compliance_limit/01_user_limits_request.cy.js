import { ComplianceLimitRequest as _body } from '../../payloads/compliance/user_limit_request';
import { Env, Support as _cy } from '../../support/support';
const { v4: uuidv4 } = require('uuid');
describe('TC007 - Test - API Compliance limit request - Create limit', () => {
  let env = Env();
  let headers;
  let token;
  let _id;
  let _payload = _body.body;

  before(async () => {
    Cypress.env('auth', null);
    Cypress.env('access_token', null);
  });

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - Get user limits by filter', async () => {
    const response = await _cy.get_request(env.compliance_limit, headers);
    _cy.expect(response, 'data');
    _cy.expect(response, 'id');
    _id = _cy.findInJson(response, 'id');
  });

  _cy._time(60000);

  it('UC002 - Create user limit request', async () => {
    let _body = { ..._payload };
    _body.user_limit_id = _id;
    const response = await _cy.post_request(
      env.compliance_create_limit,
      _body,
      headers,
    );
    _cy.expect(response, 'data');
    _cy.expect(response, 'id');
    _cy.expect(response, 'limit_type_description');
    _cy.expect(response, 'state');
    _cy.expect(response, 'status');
    _cy.expect(response, 'user_id');
    _cy.expect(response, 'user_limit_id');
  });

  it('UC003 - passing invalid id', async () => {
    let _body = { ..._payload };
    _body.user_limit_id = uuidv4();
    const response = await _cy.post_request(
      env.compliance_create_limit,
      _body,
      headers,
    );
    _cy.expect(response, 'message', `O limite não foi encontrado.`);
  });
});
