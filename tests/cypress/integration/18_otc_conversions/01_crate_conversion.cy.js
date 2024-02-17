import { OtcPayload as _body } from '../../payloads/otc_conversions/create_conversion';
import { Env, Support as _cy } from '../../support/support';
describe('TC062 - test api otc conversions - create', () => {
  let env = Env();
  let headers;
  let token;
  let id;
  let payload = _body.body;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers();
  });
  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });
  before(async () => {
    id = await _cy.read_json('quotations', 'get_new_spot');
  });
  it('UC001 - create a converion', async () => {
    let body = { ...payload };
    body.quotation_id = id.id;
    const response = await _cy.post_request(env.otc_conversions, body, headers);
    _cy.expect(response, 'id');
    _cy.expect(response, 'operation_id');
    _cy.expect(response, 'created_at');
  });
  it('create a conversion passing id invalid', async () => {
    let body = { ...payload };
    body.quotation_id = _cy.uuid_gen();
    const response = await _cy.post_request(env.otc_conversions, body, headers);
    _cy.expect(
      response,
      'message',
      'Cotação não foi encontrada. Por favor tente novamente.',
    );
  });
});
