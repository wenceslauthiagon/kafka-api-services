import { TypeCpf as _mock } from '../../../mocks/pix/type_cpf_key';
import { Env, Support as _cy } from '../../../support/support';

describe('TC061 - test api pix key - new key cpf', () => {
  let env = Env();
  let headers;
  let token;
  let data_ = `${_cy.generateData(0)}T19:27:08.127Z`;
  let payloads = _mock.response_;
  let body = _mock.body;
  let id;
  before(async () => {
    token = await _cy.headers();
  });
  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  it('UC001 - add new key type CPF', async () => {
    let _response = { ...payloads };
    _response.id = await _cy.uuid_gen();
    _response.key = _cy.generateCpf();
    _response.created_at = data_;
    _response.state = _mock.state_.CONFIRMED;
    let _body = { ...body };
    _body.key = _cy.generateCpf();
    const response = await _cy.post_request(env.pix, _body, headers);
    _cy.expect(_response, 'id');
    _cy.expect(_response, 'key');
    _cy.expect(_response, 'type');
    _cy.expect(_mock.state_.CONFIRMED);
    _cy.expect(_response, 'created_at');
    id = _cy.findInJson(response, 'id');
  });
  it('UC002 - Get a user key by id', async () => {
    const response = await _cy.get_request(`${env.pix}/${id}`, headers);
    _cy.expect(response, 'created_at');
    _cy.expect(response, 'id');
    _cy.expect(response, 'key');
    _cy.expect(_mock.state_.ADD_KEY_READY);
    _cy.expect(response, 'type');
  });
  it('UC003 - delete created key', async () => {
    const response = await _cy.delete_request(
      `${env.pix}/${id}`,
      null,
      headers,
    );
    _cy.expect(response, 'created_at');
    _cy.expect(response, 'id');
    _cy.expect(response, 'key');
    _cy.expect(_mock.state_.DELETING);
    _cy.expect(response, 'type');
  });
  it('UC004 - dismiss new key', async () => {
    const response = await _cy.post_request(
      `${env.pix}/${id}/dismiss`,
      null,
      headers,
    );
    cy.expect(response, 'created_at');
    _cy.expect(response, 'id');
    _cy.expect(response, 'key');
    _cy.expect(_mock.state_.CANCELED);
    _cy.expect(response, 'type');
  });
});
